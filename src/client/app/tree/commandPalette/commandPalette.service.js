'use strict';

(function() {

  const formElms = ['INPUT', 'SELECT', 'TEXTAREA'];

  class CommandPalette {
    constructor(_, $q, $injector, hotkeys, CommandPaletteCfg, ListSelectDialog) {
      let _this = this;

      this._ = _;
      this._$q = $q;
      this._ListSelectDialog = ListSelectDialog;

      this._commands = [];
      for (let cmdDesc of CommandPaletteCfg.commands) {
        $injector.invoke([cmdDesc.service, cmdSvc => {
          
          //TODO: platform specific / add configurable hotkey map
          let hotkeyStr = cmdDesc.hotkey ? cmdDesc.hotkey.replace(/mod\+/i, 'ctrl+') : undefined;
          
          this._commands.push({
            service: cmdSvc,
            name: cmdDesc.name,
            icon: cmdDesc.icon,
            desc: cmdDesc,
            hotkeyStr: hotkeyStr,
            asideInf: hotkeyStr
          });

          if (cmdDesc.hotkey) {
            hotkeys.add({
              combo: cmdDesc.hotkey,
              description: cmdDesc.name,
              allowIn: cmdDesc.allowHotkeyInForms ? formElms : undefined,
              callback: e => {
                e.preventDefault();
                if (_this._.isUndefined(cmdSvc.canExec) || cmdSvc.canExec(cmdDesc)) {
                  cmdSvc.exec(cmdDesc);
                }
              }
            });
          }
        }]);
      }

      this._commands = _.sortBy(this._commands, 'name');

      this._commandsByName = _.keyBy(this._commands, 'name');

      hotkeys.add({
        combo: 'mod+shift+p',
        description: 'Show command palette',
        allowIn: formElms,
        callback: (e, c) => {
          e.preventDefault();
          _this.show();
        }
      });
    }

    show() {
      let commands = this._getCommands();
      return this._ListSelectDialog.open(commands)
        .result.then(cmd => {
          return cmd.service.exec(cmd.desc);
        });
    }

    exec(commandName) {
      let command = this._getReqCommand(commandName);
      if (this._canExec(command)) {
        return this._$q.when(command.service.exec(command.desc));
      } else {
        return this._$q.when();
      }
    }

    canExec(commandName) {
      let command = this._getReqCommand(commandName);
      return this._canExec(command);
    }

    getCommand(commandName) {
      return this._commandsByName[commandName];
    }

    _canExec(command) {
      return this._.isUndefined(command.service.canExec) || command.service.canExec(command.desc);
    }

    _getCommands() {
      return this._commands.filter(cmd => this._.isUndefined(cmd.service.canExec) || cmd.service.canExec(cmd.desc));
    }

    _getReqCommand(commandName) {
      let command = this.getCommand(commandName);
      if (!command) {
        throw new Error(`Missing command ${commandName}`);
      }
      return command;
    }
  }

  angular.module('editorApp')
    .service('CommandPalette', CommandPalette);
})();
