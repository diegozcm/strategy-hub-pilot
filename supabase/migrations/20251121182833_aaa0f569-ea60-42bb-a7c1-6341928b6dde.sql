-- ETAPA 8: Criar ano OKR padrão (2025) para a Empresa Modelo
-- Isso facilita testes e garante que haja dados iniciais

DO $$
DECLARE
  _company_id UUID := '60307b2c-a6f1-4e1e-8ae3-18f1108d9254'; -- Empresa Modelo
  _year_id UUID;
BEGIN
  -- Verificar se o ano 2025 já existe
  SELECT id INTO _year_id
  FROM okr_years
  WHERE company_id = _company_id AND year = 2025;

  -- Se não existir, criar
  IF _year_id IS NULL THEN
    -- Criar ano 2025
    INSERT INTO okr_years (
      company_id,
      year,
      start_date,
      end_date,
      status,
      created_by
    )
    VALUES (
      _company_id,
      2025,
      '2025-01-01',
      '2025-12-31',
      'active', -- Ano atual como ativo
      'e0509600-0fad-47ef-a964-3a50cffdbf3a' -- Bernardo
    )
    RETURNING id INTO _year_id;

    -- Criar os 4 trimestres para 2025
    INSERT INTO okr_periods (okr_year_id, company_id, quarter, start_date, end_date, status)
    VALUES
      (_year_id, _company_id, 'Q1', '2025-01-01', '2025-03-31', 'completed'),
      (_year_id, _company_id, 'Q2', '2025-04-01', '2025-06-30', 'completed'),
      (_year_id, _company_id, 'Q3', '2025-07-01', '2025-09-30', 'completed'),
      (_year_id, _company_id, 'Q4', '2025-10-01', '2025-12-31', 'active'); -- Q4 2025 como ativo

    RAISE NOTICE 'Ano OKR 2025 criado com sucesso para Empresa Modelo';
  ELSE
    RAISE NOTICE 'Ano OKR 2025 já existe para Empresa Modelo';
  END IF;
END $$;