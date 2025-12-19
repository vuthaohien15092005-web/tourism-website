// TinyMCE configuration for admin textareas
// Apply to any textarea with class "textarea-mce"
if (window && document) {
  (function initTinyMCE() {
    if (!window.tinymce) return;
    tinymce.init({
      selector: 'textarea.textarea-mce',
      plugins: 'image link code lists table autoresize',
      toolbar:
        'undo redo | styles | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image | table | code',
      menubar: false,
      branding: false,
      statusbar: true,
      convert_urls: false,
      image_title: true,
      automatic_uploads: true,
      file_picker_types: 'image',
      file_picker_callback: (cb) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const id = 'blobid' + new Date().getTime();
            const blobCache = tinymce.activeEditor.editorUpload.blobCache;
            const base64 = reader.result.split(',')[1];
            const blobInfo = blobCache.create(id, file, base64);
            blobCache.add(blobInfo);
            cb(blobInfo.blobUri(), { title: file.name });
          };
          reader.readAsDataURL(file);
        };
        input.click();
      },
      content_style:
        'body { font-family: Helvetica, Arial, sans-serif; font-size: 16px; }',
      min_height: 280,
      autoresize_bottom_margin: 20
    });
  })();
}


