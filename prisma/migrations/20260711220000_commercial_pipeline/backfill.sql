UPDATE "Lead" SET "stage" = CASE "status"::text
  WHEN 'NOVO' THEN 'NOVO_LEAD'::"CommercialStage"
  WHEN 'EM_CONTATO' THEN 'CONTATO_REALIZADO'::"CommercialStage"
  WHEN 'EM_ANALISE' THEN 'QUALIFICACAO'::"CommercialStage"
  WHEN 'CONVERTIDO_ORCAMENTO' THEN 'PROPOSTA_ENVIADA'::"CommercialStage"
  WHEN 'PROPOSTA_ENVIADA' THEN 'PROPOSTA_ENVIADA'::"CommercialStage"
  WHEN 'AGUARDANDO_RETORNO' THEN 'AGUARDANDO_RETORNO'::"CommercialStage"
  WHEN 'FECHADO' THEN 'GANHO'::"CommercialStage"
  WHEN 'PERDIDO' THEN 'PERDIDO'::"CommercialStage"
  WHEN 'EXPIRADO' THEN 'PERDIDO'::"CommercialStage"
  WHEN 'ARQUIVADO' THEN 'PERDIDO'::"CommercialStage"
  ELSE 'NOVO_LEAD'::"CommercialStage"
END
WHERE "stage" = 'NOVO_LEAD' AND "status"::text <> 'NOVO';
