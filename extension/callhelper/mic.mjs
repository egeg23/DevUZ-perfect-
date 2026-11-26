const out = document.getElementById("out");
document.getElementById("ask").addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    out.textContent = "Готово. Закройте эту вкладку и вернитесь в панель суфлёра.";
  } catch {
    out.textContent = "Браузер не дал доступ. Нажмите на значок замка слева от адреса и разрешите микрофон.";
  }
});
