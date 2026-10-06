/**
 * jsdom does not implement the modal features of <dialog>. These small
 * stubs let ConfirmDialog specs exercise showModal()/close() without a
 * real browser. Install in a spec's beforeEach.
 */
export function installDialogStub(): void {
  if (typeof HTMLDialogElement === 'undefined') return;

  const proto = HTMLDialogElement.prototype as unknown as {
    showModal?: () => void;
    show?: () => void;
    close?: () => void;
  };

  if (typeof proto.showModal !== 'function') {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (typeof proto.show !== 'function') {
    proto.show = function show(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (typeof proto.close !== 'function') {
    proto.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  }
}
