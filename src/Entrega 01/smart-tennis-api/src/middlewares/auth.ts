import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos o Request do Express para podermos injetar o ID do usuário autenticado
export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): any => {
  // O token geralmente vem no cabeçalho: "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    
    // Injeta os dados decodificados (que contém o userId) na requisição
    req.user = decoded as { userId: string };
    next(); // Passa para a próxima função (a rota desejada)
  });
};