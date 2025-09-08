-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION update_assessment_progress()
RETURNS TRIGGER AS $$
DECLARE
    assessment_record RECORD;
    total_q INTEGER;
    answered_q INTEGER;
    progress_pct DECIMAL(5,2);
BEGIN
    -- Se foi inserção ou atualização de resposta
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Buscar informações da avaliação
        SELECT * INTO assessment_record 
        FROM beep_assessments 
        WHERE id = NEW.assessment_id;
        
        -- Contar total de perguntas (assumindo que temos ~100 perguntas)
        total_q := 100; -- Isso pode ser calculado dinamicamente
        
        -- Contar perguntas respondidas
        SELECT COUNT(*) INTO answered_q
        FROM beep_answers 
        WHERE assessment_id = NEW.assessment_id;
        
        -- Calcular percentual
        progress_pct := CASE 
            WHEN total_q > 0 THEN (answered_q::DECIMAL / total_q::DECIMAL) * 100
            ELSE 0 
        END;
        
        -- Atualizar a avaliação
        UPDATE beep_assessments 
        SET 
            total_questions = total_q,
            answered_questions = answered_q,
            progress_percentage = progress_pct,
            last_answer_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.assessment_id;
        
        RETURN NEW;
    END IF;
    
    -- Se foi exclusão de resposta
    IF TG_OP = 'DELETE' THEN
        -- Buscar informações da avaliação
        SELECT * INTO assessment_record 
        FROM beep_assessments 
        WHERE id = OLD.assessment_id;
        
        total_q := 100;
        
        -- Contar perguntas respondidas (após a exclusão)
        SELECT COUNT(*) INTO answered_q
        FROM beep_answers 
        WHERE assessment_id = OLD.assessment_id;
        
        progress_pct := CASE 
            WHEN total_q > 0 THEN (answered_q::DECIMAL / total_q::DECIMAL) * 100
            ELSE 0 
        END;
        
        -- Atualizar a avaliação
        UPDATE beep_assessments 
        SET 
            total_questions = total_q,
            answered_questions = answered_q,
            progress_percentage = progress_pct,
            last_answer_at = NOW(),
            updated_at = NOW()
        WHERE id = OLD.assessment_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql
SET search_path TO 'public';