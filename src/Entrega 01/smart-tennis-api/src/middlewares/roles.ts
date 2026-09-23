import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): any => {
    // Como injetámos a role no JWT, ela já está disponível no req.user!
    const userRole = (req.user as any)?.role;

    if (!userRole) {
      return res.status(401).json({ error: 'Usuário não autenticado ou sem perfil definido.' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: `Acesso negado. Requer: ${allowedRoles.join(' ou ')}.` });
    }

    next();
  };
};