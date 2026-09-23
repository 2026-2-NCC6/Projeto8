import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authenticateToken, AuthRequest } from './middlewares/auth';
import { authorizeRoles } from './middlewares/roles';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/ping', (req: Request, res: Response) => {
  res.json({ message: 'Pong! API Smart Tennis Arena online.' });
});

// Teste de conexão com o banco
app.get('/test-db', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    res.json({ message: 'Conectado ao MySQL com sucesso!', result: rows });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao conectar no banco', details: error });
  }
});

const PORT = process.env.PORT || 3333;

app.post('/register', async (req: Request, res: Response): Promise<any> => {
  // Agora recebemos também a role e o name (opcional) vindos do frontend
  const { email, password, role, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    // 1. Criptografa a senha com bcrypt (10 rounds de processamento)
    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role || 'praticante';

    // 2. Insere o novo usuário no banco com o perfil correto
    const [result]: any = await pool.query(
      'INSERT INTO users (email, password_hash, role, email_confirmed) VALUES (?, ?, ?, 1)',
      [email, passwordHash, userRole]
    );

    res.status(201).json({ 
      message: 'Usuário criado com sucesso!',
      userId: result.insertId 
    });

  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Este e-mail já está em uso.' });
    }
    res.status(500).json({ error: 'Erro ao criar usuário', details: error });
  }
});

app.post('/login', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    // 1. Busca o usuário no banco pelo e-mail
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 2. Compara a senha enviada em texto limpo com o hash salvo no banco
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 3. Gera o token JWT com o ID do usuário, Email e a Role!
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role || 'praticante' // Garante que a role vai no token
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // 4. Retorna o token e os dados COMPLETOS para o frontend (incluindo a role)
    res.json({
      message: 'Login bem-sucedido',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'praticante' // Importante para o AppShell atualizar o menu
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor', details: error });
  }
});

app.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;

    // Busca o perfil do usuário logado
    const [rows]: any = await pool.query(
      'SELECT id, full_name, tennis_level, institution FROM profiles WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado.' });
    }

    res.json({
      message: 'Perfil acessado com sucesso',
      profile: rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil', details: error });
  }
});

app.put('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { full_name, tennis_level, institution } = req.body;

    // Atualiza o perfil. Usa fallback para null caso algum campo não seja enviado.
    await pool.query(
      'UPDATE profiles SET full_name = ?, tennis_level = ?, institution = ? WHERE id = ?',
      [full_name || '', tennis_level || null, institution || null, userId]
    );

    res.json({
      message: 'Perfil atualizado com sucesso!',
      profile: {
        id: userId,
        full_name: full_name || '',
        tennis_level: tennis_level || null,
        institution: institution || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar perfil', details: error });
  }
});

// Rota protegida: Apenas admin e treinador podem acessar
app.get('/treinos/gestao', authenticateToken, authorizeRoles('admin', 'treinador'), (req: Request, res: Response) => {
  res.json({ message: 'Bem-vindo à área de gestão de treinos! Acesso autorizado.' });
});

// 1. Criar um novo treino (Restrito a admin e treinador)
app.post('/trainings', authenticateToken, authorizeRoles('admin', 'treinador'), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const authorId = req.user?.userId;
    const { title, description, level, difficulty, duration_minutes, target_count, status } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'O título do treino é obrigatório.' });
    }

    const [result]: any = await pool.query(
      `INSERT INTO trainings (author_id, title, description, level, difficulty, duration_minutes, target_count, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        authorId, 
        title, 
        description || '', 
        level || 'iniciante', 
        difficulty || 2, 
        duration_minutes || 20, 
        target_count || 6, 
        status || 'rascunho'
      ]
    );

    res.status(201).json({
      message: 'Treino criado com sucesso!'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar treino', details: error });
  }
});

// 2. Listar todos os treinos (Disponível para qualquer usuário logado)
app.get('/trainings', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, title, description, level, difficulty, duration_minutes, target_count, status, created_at FROM trainings ORDER BY created_at DESC'
    );

    res.json({
      message: 'Catálogo de treinos recuperado',
      total: rows.length,
      trainings: rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar treinos', details: error });
  }
});

// 3. Atualizar um treino existente (Restrito a admin e treinador)
app.put('/trainings/:id', authenticateToken, authorizeRoles('admin', 'treinador'), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { title, description, level, difficulty, duration_minutes, target_count, status } = req.body;

    const [result]: any = await pool.query(
      `UPDATE trainings 
       SET title = ?, description = ?, level = ?, difficulty = ?, duration_minutes = ?, target_count = ?, status = ?
       WHERE id = ?`,
      [title, description, level, difficulty, duration_minutes, target_count, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Treino não encontrado.' });
    }

    res.json({ message: 'Treino atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar treino', details: error });
  }
});

// 4. Eliminar um treino (Restrito a admin e treinador)
app.delete('/trainings/:id', authenticateToken, authorizeRoles('admin', 'treinador'), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const [result]: any = await pool.query('DELETE FROM trainings WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Treino não encontrado.' });
    }

    res.json({ message: 'Treino eliminado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao eliminar treino', details: error });
  }
});

// 5. Iniciar uma nova sessão de treino (Disponível para utilizadores autenticados)
app.post('/sessions', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { training_id, title, difficulty, target_count, planned_duration_seconds } = req.body;

    // 1. Insere a nova sessão com status 'em_andamento' e marca o tempo de início
    await pool.query(
      `INSERT INTO sessions 
       (user_id, training_id, title, status, difficulty, target_count, planned_duration_seconds, started_at) 
       VALUES (?, ?, ?, 'em_andamento', ?, ?, ?, NOW())`,
      [
        userId, 
        training_id || null, 
        title || 'Sessão de treino', 
        difficulty || 2, 
        target_count || 6, 
        planned_duration_seconds || 300
      ]
    );

    // 2. Recupera o UUID gerado pelo banco para devolver ao cliente/dispositivo IoT
    const [rows]: any = await pool.query(
      'SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    res.status(201).json({
      message: 'Sessão iniciada com sucesso!',
      sessionId: rows[0]?.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar sessão', details: error });
  }
});

// 6. Registrar um acerto/erro na sessão (Telemetria)
app.post('/sessions/:sessionId/hits', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { sessionId } = req.params;
    const { target_index, hit, accuracy, reaction_ms, points } = req.body;

    // target_index é o único campo obrigatório na sua regra de banco para saber qual alvo foi acionado
    if (target_index === undefined) {
      return res.status(400).json({ error: 'O índice do alvo (target_index) é obrigatório.' });
    }

    // Garante que o hit será 1 (verdadeiro) ou 0 (falso)
    const isHit = (hit === true || hit === 1) ? 1 : 0;

    await pool.query(
      `INSERT INTO session_hits 
       (session_id, user_id, target_index, hit, accuracy, reaction_ms, points) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        userId,
        target_index,
        isHit,
        accuracy || 0.00,
        reaction_ms || null,
        points || 0
      ]
    );

    res.status(201).json({ message: 'Jogada registrada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar jogada', details: error });
  }
});

// 7. Finalizar uma sessão de treino e calcular estatísticas
app.put('/sessions/:sessionId/end', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { sessionId } = req.params;

    // 1. Buscar todas as jogadas (hits) desta sessão para calcular os resultados
    const [hits]: any = await pool.query(
      'SELECT hit, accuracy, points FROM session_hits WHERE session_id = ? AND user_id = ? ORDER BY created_at ASC',
      [sessionId, userId]
    );

    let total_points = 0;
    let sum_accuracy = 0;
    let current_streak = 0;
    let best_streak = 0;
    const total_shots = hits.length;

    // 2. Loop para calcular pontuação, média de precisão e combos (streak)
    for (const shot of hits) {
      total_points += Number(shot.points) || 0;
      sum_accuracy += Number(shot.accuracy) || 0;

      if (shot.hit === 1) {
        current_streak++;
        if (current_streak > best_streak) {
          best_streak = current_streak;
        }
      } else {
        current_streak = 0; // O jogador errou, o combo zera
      }
    }

    // Calcula a média de precisão. Se não houver jogadas, é 0.00.
    const final_accuracy = total_shots > 0 ? Number((sum_accuracy / total_shots).toFixed(2)) : 0;

    // 3. Atualizar a tabela sessions fechando o treino e guardando as estatísticas
    const [result]: any = await pool.query(
      `UPDATE sessions 
       SET status = 'concluida', 
           ended_at = NOW(), 
           total_points = ?, 
           accuracy = ?, 
           best_streak = ?
       WHERE id = ? AND user_id = ? AND status = 'em_andamento'`,
      [total_points, final_accuracy, best_streak, sessionId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Sessão não encontrada ou já foi finalizada.' });
    }

  // 4. Retornar os dados compilados para o frontend exibir a "Tela de Resultados"
  res.json({
    message: 'Sessão finalizada com sucesso!',
    results: {
      total_shots,
      total_points,
      accuracy: final_accuracy,
      best_streak
    }
  });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao finalizar sessão', details: error });
  }
});

// 8. Obter dados do Dashboard do utilizador (Praticante)
app.get('/dashboard/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;

    // 1. Calcular as estatísticas globais (apenas de sessões concluídas)
    const [stats]: any = await pool.query(
      `SELECT 
        COUNT(id) as total_sessions,
        SUM(total_points) as all_time_points,
        AVG(accuracy) as average_accuracy,
        MAX(best_streak) as highest_streak
       FROM sessions 
       WHERE user_id = ? AND status = 'concluida'`,
      [userId]
    );

    // 2. Buscar o histórico das últimas 5 sessões para o gráfico/lista
    const [history]: any = await pool.query(
      `SELECT id, title, total_points, accuracy, best_streak, ended_at 
       FROM sessions 
       WHERE user_id = ? AND status = 'concluida'
       ORDER BY ended_at DESC 
       LIMIT 5`,
      [userId]
    );

    const overview = stats[0];

    res.json({
      message: 'Dashboard carregado com sucesso!',
      overview: {
        total_sessions: overview.total_sessions || 0,
        all_time_points: overview.all_time_points || 0,
        average_accuracy: overview.average_accuracy ? Number(overview.average_accuracy).toFixed(2) : 0,
        highest_streak: overview.highest_streak || 0
      },
      recent_sessions: history
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar o dashboard', details: error });
  }
});

// 9. Leaderboard (Ranking global dos melhores praticantes)
app.get('/leaderboard', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    // Agrupa as sessões concluídas por utilizador e soma os pontos
    const [ranking]: any = await pool.query(
      `SELECT 
        u.email,
        SUM(s.total_points) as total_score,
        AVG(s.accuracy) as avg_accuracy,
        COUNT(s.id) as matches_played
       FROM sessions s
       INNER JOIN users u ON s.user_id = u.id
       WHERE s.status = 'concluida'
       GROUP BY s.user_id, u.email
       ORDER BY total_score DESC
       LIMIT 10`
    );

    res.json({
      message: 'Leaderboard carregado com sucesso!',
      leaderboard: ranking.map((player: any, index: number) => ({
        rank: index + 1, // Atribui a posição 1, 2, 3...
        player: player.email.split('@')[0], // Pega apenas a parte antes do @
        total_score: Number(player.total_score) || 0,
        avg_accuracy: player.avg_accuracy ? Number(player.avg_accuracy).toFixed(2) : "0.00",
        matches_played: player.matches_played
      }))
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar o leaderboard', details: error });
  }
});

// 10. Mapa de Alvos (Análise de acertos por zona da quadra)
app.get('/dashboard/me/targets', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;

    // Agrupa as jogadas pelo índice do alvo e calcula a percentagem de acerto
    const [targets]: any = await pool.query(
      `SELECT 
        target_index,
        COUNT(*) as total_shots,
        SUM(hit) as total_hits,
        (SUM(hit) / COUNT(*)) * 100 as hit_percentage
       FROM session_hits
       WHERE user_id = ?
       GROUP BY target_index
       ORDER BY target_index ASC`,
      [userId]
    );

    res.json({
      message: 'Mapa de alvos carregado com sucesso!',
      targets: targets.map((t: any) => ({
        target_index: t.target_index,
        total_shots: Number(t.total_shots),
        total_hits: Number(t.total_hits) || 0,
        hit_percentage: t.hit_percentage ? Number(t.hit_percentage).toFixed(2) : "0.00"
      }))
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar o mapa de alvos', details: error });
  }
});

app.get('/trainings/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM trainings WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Treino não encontrado' });
    res.json({ training: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar treino' });
  }
});

// Obter detalhes de UMA sessão específica (Frontend usa /sessoes/:id)
app.get('/sessoes/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM sessions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Sessão não encontrada' });
    res.json({ session: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar sessão' });
  }
});

// Obter todos os hits de uma sessão
app.get('/sessoes/:id/hits', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM session_hits WHERE session_id = ? ORDER BY created_at ASC', [req.params.id]);
    res.json({ hits: rows });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar hits' });
  }
});

// Atualizar status da sessão (Frontend usa PUT /sessoes/:id em vez de /sessions/:id/end)
app.put('/sessoes/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { status, started_at, ended_at, total_points, bonus_points, accuracy, best_streak } = req.body;
    
    // Constrói a query de update dinamicamente baseada no que foi enviado
    await pool.query(
      `UPDATE sessions 
       SET status = COALESCE(?, status), 
           started_at = COALESCE(?, started_at), 
           ended_at = COALESCE(?, ended_at), 
           total_points = COALESCE(?, total_points), 
           bonus_points = COALESCE(?, bonus_points), 
           accuracy = COALESCE(?, accuracy), 
           best_streak = COALESCE(?, best_streak)
       WHERE id = ? AND user_id = ?`,
      [status, started_at, ended_at, total_points, bonus_points, accuracy, best_streak, req.params.id, req.user?.userId]
    );
    res.json({ message: 'Sessão atualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar sessão' });
  }
});

// Salvar múltiplos hits de uma vez (quando a sessão finaliza)
app.post('/sessoes/:id/hits', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { hits } = req.body; // array de hits
    if (!hits || !hits.length) return res.json({ message: 'Sem hits para salvar' });

    const values = hits.map((h: any) => [
      req.params.id, req.user?.userId, h.target_index, h.hit ? 1 : 0, h.accuracy, h.reaction_ms || null, h.points
    ]);

    await pool.query(
      `INSERT INTO session_hits (session_id, user_id, target_index, hit, accuracy, reaction_ms, points) VALUES ?`,
      [values]
    );
    res.status(201).json({ message: 'Hits salvos' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar hits' });
  }
});

// Treinos atribuídos (Página: Meus Treinos)
app.get('/minhas-atribuicoes', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const [rows]: any = await pool.query(
      `SELECT a.*, 
        JSON_OBJECT('id', t.id, 'title', t.title, 'level', t.level, 'description', t.description) as trainings
       FROM training_assignments a
       JOIN trainings t ON a.training_id = t.id
       WHERE a.student_id = ? ORDER BY a.created_at DESC`,
      [req.user?.userId]
    );
    res.json({ assignments: rows });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar atribuições' });
  }
});

// ==========================================
// ROTAS DE ADMIN
// ==========================================
app.get('/admin/profiles', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const [rows] = await pool.query('SELECT id, full_name, email, created_at FROM profiles');
  res.json({ profiles: rows });
});

app.get('/admin/sessions', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const [rows] = await pool.query('SELECT id, accuracy, status, created_at, total_points FROM sessions ORDER BY created_at DESC');
  res.json({ sessions: rows });
});

app.get('/admin/trainings', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const [rows] = await pool.query('SELECT id, title, status, updated_at, version FROM trainings ORDER BY updated_at DESC LIMIT 8');
  res.json({ trainings: rows });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});