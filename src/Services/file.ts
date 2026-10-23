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

export function showFileDialog(capture?: 'environment' | 'user'): Promise<FileList> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) {
      input.capture = capture;
    }
    input.addEventListener('change', (e) => {
      const { files } = e.target as HTMLInputElement;
      resolve(files || new FileList());
    });
    input.click();
  });
}
