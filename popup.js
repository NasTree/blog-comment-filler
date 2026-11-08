document.addEventListener('DOMContentLoaded', () => {
  const nicknameInput = document.getElementById('nickname');
  const emailInput = document.getElementById('email');
  const urlInput = document.getElementById('url');
  const saveButton = document.getElementById('save');
  const status = document.getElementById('status');

  // 打开弹窗时，回填已保存的信息
  chrome.storage.sync.get(['nickname', 'email', 'url'], (data) => {
    if (data.nickname) nicknameInput.value = data.nickname;
    if (data.email) emailInput.value = data.email;
    if (data.url) urlInput.value = data.url;
  });

  // 点击保存，把昵称、邮箱、网址存到浏览器同步存储
  saveButton.addEventListener('click', () => {
    chrome.storage.sync.set({
      nickname: nicknameInput.value.trim(),
      email: emailInput.value.trim(),
      url: urlInput.value.trim()
    }, () => {
      status.textContent = '已保存';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
  });
});
