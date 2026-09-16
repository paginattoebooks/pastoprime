const form = document.getElementById('curral-form');

if (form) {
  const resultBox = document.getElementById('result');
  const resultText = document.getElementById('result-text');
  const loadingLabel = document.getElementById('loading-label');
  const submitButton = document.getElementById('submit-button');

  function getFormData() {
    const formData = new FormData(form);
    return Object.fromEntries(formData.entries());
  }

  function formatResult(data) {
    const text = data?.text || 'Não foi possível gerar a recomendação agora.';
    return text.trim();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const data = getFormData();
    submitButton.disabled = true;
    submitButton.textContent = 'Gerando...';
    loadingLabel.hidden = false;
    resultBox.hidden = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Erro ao gerar a recomendação.');
      }

      resultText.textContent = formatResult(payload);
      resultBox.hidden = false;
      loadingLabel.hidden = true;
    } catch (error) {
      resultText.textContent = `Não foi possível concluir a análise neste momento.\n\nMotivo: ${error.message || 'erro inesperado'}.\n\nTente novamente em alguns instantes.`;
      resultBox.hidden = false;
      loadingLabel.hidden = true;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Gerar recomendação';
    }
  }

  form.addEventListener('submit', handleSubmit);
}
