(function () {
  var BUTTON_CLASS = 'blog-comment-filler-btn';
  var BUTTON_BG = '#FFBD2E';

  // 读取插件弹窗里保存的昵称、邮箱、网址
  function getSavedInfo() {
    return new Promise(function (resolve) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['nickname', 'email', 'url'], function (data) {
          resolve(data || {});
        });
      } else {
        resolve({});
      }
    });
  }

  // 黄色小提示条
  function showToast(message) {
    var toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = [
      'position: fixed',
      'left: 50%',
      'bottom: 24px',
      'transform: translateX(-50%)',
      'padding: 10px 18px',
      'border-radius: 8px',
      'background: ' + BUTTON_BG,
      'color: #333',
      'font-size: 14px',
      "font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2)',
      'z-index: 99999'
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 2000);
  }

  function fieldText(input) {
    return ((input.name || '') + ' ' + (input.id || '') + ' ' + (input.placeholder || '')).toLowerCase();
  }

  function isNicknameField(input) {
    var text = fieldText(input);
    var placeholder = input.placeholder || '';
    return (
      text.indexOf('author') !== -1 ||
      text.indexOf('nickname') !== -1 ||
      text.indexOf('nick') !== -1 ||
      text.indexOf('name') !== -1 ||
      placeholder.indexOf('昵称') !== -1 ||
      placeholder.indexOf('名字') !== -1
    );
  }

  function isEmailField(input) {
    var text = fieldText(input);
    return (
      input.type === 'email' ||
      text.indexOf('email') !== -1 ||
      text.indexOf('mail') !== -1 ||
      (input.placeholder || '').indexOf('邮箱') !== -1
    );
  }

  function isUrlField(input) {
    var text = fieldText(input);
    return (
      input.type === 'url' ||
      text.indexOf('url') !== -1 ||
      text.indexOf('website') !== -1 ||
      text.indexOf('site') !== -1 ||
      (input.placeholder || '').indexOf('网址') !== -1 ||
      (input.placeholder || '').indexOf('网站') !== -1
    );
  }

  // 在评论表单里找到昵称、邮箱、网址三个输入框
  function findFields(container) {
    var inputs = Array.prototype.slice.call(
      container.querySelectorAll('input[type="text"], input[type="email"], input[type="url"], input:not([type])')
    ).filter(function (input) {
      return input.offsetParent !== null;
    });
    var fields = { nickname: null, email: null, url: null };
    var rest = [];
    inputs.forEach(function (input) {
      if (!fields.email && isEmailField(input)) {
        fields.email = input;
      } else if (!fields.url && isUrlField(input)) {
        fields.url = input;
      } else if (!fields.nickname && isNicknameField(input)) {
        fields.nickname = input;
      } else {
        rest.push(input);
      }
    });
    // 兜底：如果三个字段按昵称、邮箱、网址的顺序排列，按顺序填
    if (!fields.nickname && !fields.email && !fields.url && rest.length === 3) {
      fields.nickname = rest[0];
      fields.email = rest[1];
      fields.url = rest[2];
    }
    return fields;
  }

  function setValue(input, value) {
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function fillFields(container, info) {
    var fields = findFields(container);
    var filled = 0;
    if (fields.nickname && info.nickname) {
      setValue(fields.nickname, info.nickname);
      filled++;
    }
    if (fields.email && info.email) {
      setValue(fields.email, info.email);
      filled++;
    }
    if (fields.url && info.url) {
      setValue(fields.url, info.url);
      filled++;
    }
    return filled;
  }

  // 在「提交评论」按钮左边插入黄色的「信息填充」按钮
  function addFillButton(container, submitButton) {
    if (container.querySelector('.' + BUTTON_CLASS)) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = BUTTON_CLASS;
    button.style.cssText = [
      'display: inline-flex',
      'align-items: center',
      'gap: 4px',
      'padding: 6px 12px',
      'margin-right: 8px',
      'border: none',
      'border-radius: 8px',
      'background: ' + BUTTON_BG,
      'color: #333',
      'font-size: 14px',
      'cursor: pointer'
    ].join(';');
    var logo = document.createElement('img');
    logo.alt = '';
    logo.style.cssText = 'width: 16px; height: 16px; display: block;';
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      logo.src = chrome.runtime.getURL('icons/icon16.png');
    }
    button.appendChild(logo);
    button.appendChild(document.createTextNode('信息填充'));
    button.addEventListener('click', function () {
      getSavedInfo().then(function (info) {
        if (!info.nickname && !info.email && !info.url) {
          showToast('请先在插件弹窗里填写信息');
          return;
        }
        var filled = fillFields(container, info);
        showToast(filled > 0 ? '已填充' : '没有找到可以填写的输入框');
      });
    });
    submitButton.parentNode.insertBefore(button, submitButton);
  }

  function findSubmitButton(container) {
    var candidates = Array.prototype.slice.call(
      container.querySelectorAll('button, input[type="submit"], input[type="button"]')
    );
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      var text = (el.value || el.textContent || '').trim();
      if (/提交评论|发表评论|提交|发表|发送评论/.test(text) && el.offsetParent !== null) {
        return el;
      }
    }
    return null;
  }

  function processContainer(container) {
    if (container.dataset.blogCommentFillerDone) return;
    var submitButton = findSubmitButton(container);
    if (!submitButton) return;
    container.dataset.blogCommentFillerDone = '1';
    addFillButton(container, submitButton);
    // 打开评论框时，如果三个输入框都还空着，就自动填好
    getSavedInfo().then(function (info) {
      if (!info.nickname && !info.email && !info.url) return;
      var fields = findFields(container);
      var allEmpty =
        (!fields.nickname || !fields.nickname.value) &&
        (!fields.email || !fields.email.value) &&
        (!fields.url || !fields.url.value);
      if (allEmpty) fillFields(container, info);
    });
  }

  function scan() {
    var containers = Array.prototype.slice.call(document.querySelectorAll('form'));
    // 有些评论系统不用 form，兜底找常见的评论容器
    if (containers.length === 0) {
      containers = Array.prototype.slice.call(
        document.querySelectorAll('#commentform, .comment-form, .vcomment, .wl-comment, .comment-respond')
      );
    }
    containers.forEach(processContainer);
  }

  // 监听动态加载的评论框
  var observer = new MutationObserver(function () {
    scan();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
