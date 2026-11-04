// Kopieren, als Datei speichern und Dateien lesen (Prompt, Bauplan-JSON)

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Älteres iOS / ohne Berechtigung: über ein unsichtbares Textfeld
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadText(fileName: string, text: string, type = 'text/plain'): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readFileText(file: File): Promise<string> {
  if (file.size > 2 * 1024 * 1024) throw new Error('Die Datei ist zu groß (höchstens 2 MB).');
  return file.text();
}
