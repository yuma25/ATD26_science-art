module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // 日本語でのコミットを許可するため、ケース（大文字・小文字）のチェックを無効化
    "subject-case": [0],
    // 日本語は文字数が少なくなりがちだが、一応長制限も緩和
    "header-max-length": [0],
  },
};
