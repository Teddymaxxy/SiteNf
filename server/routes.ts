import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertUserSchema, loginSchema, registerSchema, insertMessageSchema, type User, type MessageWithUser } from "@shared/schema";
import { z } from "zod";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

// Auth middleware
interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'senha'>;
}

const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    // Remove password from user object
    const { senha, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido" });
  }
};

// WebSocket connection management
interface ConnectedUser {
  userId: number;
  ws: WebSocket;
  nome: string;
}

const connectedUsers = new Map<number, ConnectedUser>();

// Rate limiting for messages
interface RateLimitData {
  messages: number[];
  lastMessage: number;
  blockedUntil: number;
  recentMessages: string[]; // Store recent message contents for spam detection
}

const userRateLimits = new Map<number, RateLimitData>();
const RATE_LIMIT_WINDOW = 5000; // 5 seconds in milliseconds
const MAX_MESSAGES_PER_WINDOW = 10; // Maximum 10 messages per 5 seconds
const BLOCK_DURATION = 5000; // 5 seconds block when limit exceeded
const MAX_REPEATED_MESSAGES = 3; // Maximum 3 repeated messages in a row

const checkRateLimit = (userId: number, messageContent: string): { allowed: boolean; message?: string; remainingTime?: number } => {
  const now = Date.now();
  const userLimit = userRateLimits.get(userId) || { 
    messages: [], 
    lastMessage: 0, 
    blockedUntil: 0,
    recentMessages: []
  };
  
  // Check if user is currently blocked
  if (userLimit.blockedUntil > now) {
    const remainingTime = Math.ceil((userLimit.blockedUntil - now) / 1000);
    return { 
      allowed: false, 
      message: `Você está temporariamente bloqueado. Aguarde ${remainingTime} segundos.`,
      remainingTime 
    };
  }
  
  // Clean old messages outside the window
  userLimit.messages = userLimit.messages.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  // Check repeated messages spam
  const trimmedContent = messageContent.trim().toLowerCase();
  if (userLimit.recentMessages.length >= MAX_REPEATED_MESSAGES) {
    const lastThree = userLimit.recentMessages.slice(-MAX_REPEATED_MESSAGES);
    if (lastThree.every(msg => msg === trimmedContent)) {
      return { 
        allowed: false, 
        message: `Não envie a mesma mensagem repetidamente. Máximo ${MAX_REPEATED_MESSAGES} mensagens iguais seguidas.` 
      };
    }
  }
  
  // Check if user exceeded rate limit
  if (userLimit.messages.length >= MAX_MESSAGES_PER_WINDOW) {
    // Block user for BLOCK_DURATION
    userLimit.blockedUntil = now + BLOCK_DURATION;
    userRateLimits.set(userId, userLimit);
    return { 
      allowed: false, 
      message: `Limite de ${MAX_MESSAGES_PER_WINDOW} mensagens em ${RATE_LIMIT_WINDOW/1000} segundos atingido. Bloqueado por ${BLOCK_DURATION/1000} segundos.`,
      remainingTime: BLOCK_DURATION / 1000
    };
  }
  
  // Update rate limit data
  userLimit.messages.push(now);
  userLimit.lastMessage = now;
  
  // Update recent messages for spam detection (keep last 5 messages)
  userLimit.recentMessages.push(trimmedContent);
  if (userLimit.recentMessages.length > 5) {
    userLimit.recentMessages.shift();
  }
  
  userRateLimits.set(userId, userLimit);
  
  return { allowed: true };
};

const broadcastToAllUsers = (message: any) => {
  const messageStr = JSON.stringify(message);
  connectedUsers.forEach((user) => {
    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(messageStr);
    }
  });
};

const broadcastOnlineUsers = async () => {
  const onlineUsers = await storage.getOnlineUsers();
  broadcastToAllUsers({
    type: 'onlineUsers',
    users: onlineUsers,
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.senha, 10);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        senha: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Remove password from response
      const { senha, ...userWithoutPassword } = user;

      res.status(201).json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Register error:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.senha, user.senha);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Remove password from response
      const { senha, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Login error:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // Message routes
  app.get('/api/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const messages = await storage.getRecentMessages(50);
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  });

  app.get('/api/users/online', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const onlineUsers = await storage.getOnlineUsers();
      res.json(onlineUsers);
    } catch (error) {
      console.error('Get online users error:', error);
      res.status(500).json({ message: "Erro ao buscar usuários online" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'authenticate':
            try {
              const decoded = jwt.verify(message.token, JWT_SECRET) as any;
              const user = await storage.getUser(decoded.userId);
              
              if (user) {
                // Store user connection
                connectedUsers.set(user.id, {
                  userId: user.id,
                  ws,
                  nome: user.nome,
                });

                // Update user online status
                await storage.updateUserOnlineStatus(user.id, true);

                // Send authentication success
                ws.send(JSON.stringify({
                  type: 'authenticated',
                  user: { id: user.id, nome: user.nome, email: user.email },
                }));

                // Broadcast updated online users list
                await broadcastOnlineUsers();

                // Send recent messages
                const recentMessages = await storage.getRecentMessages(50);
                ws.send(JSON.stringify({
                  type: 'messageHistory',
                  messages: recentMessages,
                }));
              }
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Authentication failed',
              }));
            }
            break;

          case 'sendMessage':
            // Find user connection
            const userConnection = Array.from(connectedUsers.values()).find(conn => conn.ws === ws);
            if (userConnection && message.content?.trim()) {
              const trimmedContent = message.content.trim();
              
              // Check rate limit and spam
              const rateLimitCheck = checkRateLimit(userConnection.userId, trimmedContent);
              if (!rateLimitCheck.allowed) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: rateLimitCheck.message,
                  remainingTime: rateLimitCheck.remainingTime,
                }));
                break;
              }

              // Validate message length
              if (trimmedContent.length > 500) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Mensagem muito longa. Máximo de 500 caracteres.',
                }));
                break;
              }

              // Save message to database
              const savedMessage = await storage.createMessage({
                conteudo: trimmedContent,
                usuarioId: userConnection.userId,
              });

              // Create message with user info for broadcasting
              const messageWithUser: MessageWithUser = {
                ...savedMessage,
                usuario: {
                  id: userConnection.userId,
                  nome: userConnection.nome,
                },
              };

              // Broadcast message to all connected users
              broadcastToAllUsers({
                type: 'newMessage',
                message: messageWithUser,
              });
              
              console.log(`Message sent by ${userConnection.nome}: ${trimmedContent}`);
            }
            break;

          case 'typing':
            // Broadcast typing indicator to other users
            const typingUser = Array.from(connectedUsers.values()).find(conn => conn.ws === ws);
            if (typingUser) {
              connectedUsers.forEach((user) => {
                if (user.userId !== typingUser.userId && user.ws.readyState === WebSocket.OPEN) {
                  user.ws.send(JSON.stringify({
                    type: 'userTyping',
                    user: { nome: typingUser.nome },
                    isTyping: message.isTyping,
                  }));
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });

    ws.on('close', async () => {
      // Find and remove user connection
      const userEntry = Array.from(connectedUsers.entries()).find(([_, conn]) => conn.ws === ws);
      
      if (userEntry) {
        const [userId, userConnection] = userEntry;
        connectedUsers.delete(userId);
        
        // Clean up rate limit data
        userRateLimits.delete(userId);
        
        // Update user offline status
        await storage.updateUserOnlineStatus(userId, false);
        
        // Broadcast updated online users list
        await broadcastOnlineUsers();
        
        console.log(`User ${userConnection.nome} disconnected`);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
