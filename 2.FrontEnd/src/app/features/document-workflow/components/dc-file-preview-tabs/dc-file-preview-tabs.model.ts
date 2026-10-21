export interface DcFilePreviewTab {
  fileId: string;
  fileName: string;
  title: string;
}

export function dcFilePreviewTabTitle(fileName: string, maxLen = 28): string {
  const name = (fileName || 'Tệp').trim();
  return name.length > maxLen ? `${name.slice(0, maxLen)}…` : name;
}
