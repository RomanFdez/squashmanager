-- Limpia datos de acceso para socios Junior (ya que no deben loguearse)

UPDATE public.members
SET 
  email = NULL,
  password = NULL
WHERE type = 'junior';

-- Mostrar los afectados para confirmar
SELECT id, name, type, email, password 
FROM public.members 
WHERE type = 'junior';
