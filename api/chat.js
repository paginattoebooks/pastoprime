module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  const payload = request.body || {};
  const { tipo, animais, area, objetivo, sistema } = payload;

  const prompt = `Crie uma recomendação prática para um curral de ${tipo || 'gado'} com ${animais || 0} animais, área disponível de ${area || 0} m² e objetivo ${objetivo || 'vender como projeto inicial'}. Considere ${sistema || 'estrutura simples'} e responda em português do Brasil, em 5 blocos curtos: 1) layout do curral, 2) dimensões sugeridas, 3) fluxo de manejo, 4) materiais recomendados e 5) cautelas de bem-estar animal.`;

  if (!process.env.OPENAI_API_KEY) {
    return response.status(200).json({
      ok: true,
      source: 'fallback',
      text: `Recomendação inicial para ${tipo || 'o sistema'}:\n\n1) Layout: organize o curral em área de descanso, alimentação e manejo, com separação por lote e passagem de acesso.\n2) Dimensões: estime cerca de ${Math.max(12, Number(animais || 20) * 2.5)} m² por animal em sistema semi-intensivo, ajustando a área conforme o peso e o manejo.\n3) Fluxo: posicione entrada, descanso, alimentação e saída em sequência simples para evitar aglomeração.\n4) Materiais: cerca de PVC ou arame, reforço em madeira tratada, piso drenante e bebedouro na região mais próxima da área de descanso.\n5) Cautelas: garanta ventilação, sombra, drenagem e espaço para deslocamento sem stress.\n\nEssa resposta está funcionando em modo local, sem chave da API no ambiente. Ao configurar OPENAI_API_KEY no Vercel, o projeto passa a usar análise com GPT.`
    });
  }

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em planejamento de curral para produção rural. Responda em português do Brasil e seja pratico, claro e objetivo.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const data = await openAiResponse.json();

    if (!openAiResponse.ok) {
      throw new Error(data?.error?.message || 'Falha ao consultar a API do OpenAI.');
    }

    const answer = data.choices?.[0]?.message?.content || 'Não foi possível gerar a resposta.';

    return response.status(200).json({
      ok: true,
      source: 'openai',
      text: answer
    });
  } catch (error) {
    return response.status(200).json({
      ok: true,
      source: 'fallback',
      text: `Recomendação inicial para ${tipo || 'o sistema'}:\n\n1) Layout: separe áreas de descanso, alimentação e manejo em sequência simples.\n2) Dimensões: para ${animais || 20} animais, calcule, no mínimo, ${Math.max(10, Number(animais || 20) * 2)} m² de área útil em sistema simples.\n3) Fluxo: mantenha a entrada, o deslocamento e a saída em ordem sem cruzamento.\n4) Materiais: use cerca de reforço, divisórias internas, piso de drenagem e bebedouro próximo da área de descanso.\n5) Cautelas: mantenha ventilação, sombra e água para reduzir estresse e melhorar a produtividade.\n\nA API teve problema temporário, mas a recomendação de base foi gerada corretamente.`
    });
  }
};
