module.exports = [
  {
    "type": "confirm",
    "message": "use git",
    "name": "git",
    "default": true
  },
  {
    "type": "list",
    "message": "use which language",
    "name": "language",
    "default": "javascript",
    "choices": [
      "javascript",
      "typescript"
    ],
    "pageSize": 2
  },
  {
    "type": "confirm",
    "message": "Would you like to use the template tools?",
    "name": "tools",
    "default": true
  },
];