export function inputFileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = async function (file: ProgressEvent<FileReader>) {
      if (!file.target?.result) {
        return;
      }
      resolve(file.target.result as ArrayBuffer);
    };
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(file);
  });
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function showFileDialog(): Promise<FileList> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.addEventListener('change', (e) => {
      const { files } = e.target as HTMLInputElement;
      resolve(files || new FileList());
    });
    input.click();
  });
}
