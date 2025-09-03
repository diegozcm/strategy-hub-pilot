-- Remover dicas de mentoria inválidas com mentor_id fictício
DELETE FROM public.mentoring_tips 
WHERE mentor_id = '11111111-1111-1111-1111-111111111111';