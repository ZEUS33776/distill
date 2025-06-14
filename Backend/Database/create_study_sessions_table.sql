-- Create study_sessions table for storing quiz and flashcard study sessions
DROP TABLE IF EXISTS study_sessions;

CREATE TABLE study_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('quiz', 'flashnotes')),
    name VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_session_id ON study_sessions(session_id);
CREATE INDEX idx_study_sessions_type ON study_sessions(type);
CREATE INDEX idx_study_sessions_created_at ON study_sessions(created_at DESC); 