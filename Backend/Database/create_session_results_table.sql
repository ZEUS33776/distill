-- Create session_results table for storing quiz and flashcard session results
DROP TABLE IF EXISTS session_results;

CREATE TABLE session_results (
    id SERIAL PRIMARY KEY,
    study_session_id VARCHAR(255) NOT NULL, -- Changed to VARCHAR to support both numeric IDs and AI-generated hashes
    user_id VARCHAR(255) NOT NULL,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('quiz', 'flashnotes')),
    session_name VARCHAR(255) NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    incorrect_answers INTEGER NOT NULL DEFAULT 0,
    skipped_answers INTEGER NOT NULL DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    difficulty_breakdown JSONB, -- Store breakdown by difficulty level
    detailed_results JSONB, -- Store individual question/card results
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_session_results_user_id ON session_results(user_id);
CREATE INDEX idx_session_results_study_session_id ON session_results(study_session_id);
CREATE INDEX idx_session_results_session_type ON session_results(session_type);
CREATE INDEX idx_session_results_completed_at ON session_results(completed_at DESC);
CREATE INDEX idx_session_results_accuracy ON session_results(accuracy_percentage DESC);

-- Add a composite index for efficient quiz-specific comparisons
CREATE INDEX idx_session_results_user_session ON session_results(user_id, study_session_id, completed_at DESC); 