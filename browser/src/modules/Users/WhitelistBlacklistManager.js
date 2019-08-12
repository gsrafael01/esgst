import { ButtonSet } from '../../class/ButtonSet';
import { Module } from '../../class/Module';
import { Popup } from '../../class/Popup';
import { ToggleSwitch } from '../../class/ToggleSwitch';
import { utils } from '../../lib/jsUtils';
import { common } from '../Common';
import { gSettings } from '../../class/Globals';
import { shared } from '../../class/Shared';

const
  parseHtml = utils.parseHtml.bind(utils),
  createConfirmation = common.createConfirmation.bind(common),
  createElements = common.createElements.bind(common),
  createFadeMessage = common.createFadeMessage.bind(common),
  createHeadingButton = common.createHeadingButton.bind(common),
  downloadFile = common.downloadFile.bind(common),
  formatTags = common.formatTags.bind(common),
  request = common.request.bind(common),
  setSetting = common.setSetting.bind(common)
  ;

class UsersWhitelistBlacklistManager extends Module {
  constructor() {
    super();
    this.info = {
      description: [
        [`ul`, [
          [`li`, [
            `Adds a button (`,
            [`i`, { class: `fa fa-arrow-up` }],
            ` `,
            [`i`, { class: `fa fa-arrow-down` }],
            ` `,
            [`i`, { class: `fa fa-trash` }],
            `) to the main page heading of your `,
            [`a`, { href: `https://www.steamgifts.com/account/manage/whitelist` }, `whitelist`],
            `/`,
            [`a`, { href: `https://www.steamgifts.com/account/manage/blacklist` }, `blacklist`],
            ` pages that allows you to import/export/clear your whitelist/blacklist.`
          ]]
        ]]
      ],
      id: `wbm`,
      name: `Whitelist/Blacklist Manager`,
      sg: true,
      type: `users`
    };
  }

  init() {
    if (!shared.esgst.whitelistPath && !shared.esgst.blacklistPath) return;
    let wbm = {};
    if (shared.esgst.whitelistPath) {
      wbm.key = `whitelist`;
      wbm.name = `Whitelist`;
    } else {
      wbm.key = `blacklist`;
      wbm.name = `Blacklist`;
    }
    wbm.button = createHeadingButton({
      id: `wbm`,
      icons: [`fa-arrow-up`, `fa-arrow-down`, `fa-trash`],
      title: `Manage ${wbm.key}`
    });
    wbm.button.addEventListener(`click`, this.wbm_openPopup.bind(this, wbm));
  }

  wbm_openPopup(wbm) {
    if (!wbm.popup) {
      wbm.popup = new Popup({ addScrollable: true, icon: `fa-gear`, title: `Manage ${wbm.name}:` });
      new ToggleSwitch(wbm.popup.description, `wbm_useCache`, false, `Use cache.`, false, false, `Uses the cache created the last time you synced your whitelist/blacklist. This speeds up the process, but could lead to incomplete results if your cache isn't up-to-date.`, gSettings.wbm_useCache);
      new ToggleSwitch(wbm.popup.description, `wbm_clearTags`, false, [
        `Only clear users who are tagged with these specific tags (separate with comma): `,
        [`input`, { class: `esgst-switch-input esgst-switch-input-large`, type: `text`, value: gSettings.wbm_tags.join(`, `) }]
      ], false, false, `Uses the User Tags database to remove only users with the specified tags.`, gSettings.wbm_clearTags).name.firstElementChild.addEventListener(`change`, event => {
        const element = event.currentTarget;
        let tags = element.value.replace(/(,\s*)+/g, formatTags).split(`, `);
        setSetting(`wbm_tags`, tags);
      });
      wbm.input = createElements(wbm.popup.description, `beforeEnd`, [{
        attributes: {
          type: `file`
        },
        type: `input`
      }]);
      wbm.message = createElements(wbm.popup.description, `beforeEnd`, [{
        attributes: {
          class: `esgst-description`
        },
        type: `div`
      }]);
      wbm.warning = createElements(wbm.popup.description, `beforeEnd`, [{
        attributes: {
          class: `esgst-description esgst-warning`
        },
        type: `div`
      }]);
      wbm.popup.description.appendChild(new ButtonSet({
        color1: `green`,
        color2: `grey`,
        icon1: `fa-arrow-up`,
        icon2: `fa-times`,
        title1: `Import`,
        title2: `Cancel`,
        callback1: () => {
          return new Promise(resolve => this.wbm_start(wbm, this.wbm_importList.bind(this, wbm), resolve));
        },
        callback2: this.wbm_cancel.bind(this, wbm)
      }).set);
      wbm.popup.description.appendChild(new ButtonSet({
        color1: `green`,
        color2: `grey`,
        icon1: `fa-arrow-down`,
        icon2: `fa-times`,
        title1: `Export`,
        title2: `Cancel`,
        callback1: () => {
          return new Promise(resolve => this.wbm_start(wbm, this.wbm_exportList.bind(this, wbm, [], 1), resolve));
        },
        callback2: this.wbm_cancel.bind(this, wbm)
      }).set);
      wbm.popup.description.appendChild(new ButtonSet({
        color1: `green`,
        color2: `grey`,
        icon1: `fa-trash`,
        icon2: `fa-times`,
        title1: `Clear`,
        title2: `Cancel`,
        callback1: () => {
          return new Promise(resolve => this.wbm_start(wbm, this.wbm_clearList.bind(this, wbm, [], 1), resolve));
        },
        callback2: this.wbm_cancel.bind(this, wbm)
      }).set);
      wbm.results = createElements(wbm.popup.scrollable, `beforeEnd`, [{
        type: `div`
      }]);
    }
    wbm.popup.open();
  }

  wbm_start(wbm, callback, mainCallback) {
    createConfirmation(`Are you sure you want to do this?`, () => {
      wbm.isCanceled = false;
      wbm.button.classList.add(`esgst-busy`);
      wbm.usernames = [];
      wbm.results.innerHTML = ``;
      callback(this.wbm_complete.bind(this, wbm, mainCallback));
    }, mainCallback);
  }

  wbm_complete(wbm, callback) {
    wbm.button.classList.remove(`esgst-busy`);
    callback();
  }

  wbm_cancel(wbm) {
    wbm.isCanceled = true;
    wbm.button.classList.remove(`esgst-busy`);
  }

  wbm_importList(wbm, callback) {
    let file = wbm.input.files[0];
    if (file) {
      let reader = new FileReader();
      reader.onload = () => {
        try {
          // @ts-ignore
          let list = JSON.parse(reader.result);
          // noinspection JSIgnoredPromiseFromCall
          this.wbm_insertUsers(wbm, list, 0, list.length, callback);
        } catch (error) {
          createFadeMessage(wbm.warning, `Cannot parse file!`);
          callback();
        }
      };
      reader.readAsText(file);
    } else {
      createFadeMessage(wbm.warning, `No file was loaded!`);
      callback();
    }
  }

  async wbm_insertUsers(wbm, list, i, n, callback) {
    if (wbm.isCanceled) return;
    createElements(wbm.message, `inner`, [{
      attributes: {
        class: `fa fa-circle-o-notch fa-spin`
      },
      type: `i`
    }, {
      text: `Importing list (${i} of ${n})...`,
      type: `span`
    }]);
    if (i < n) {
      await request({
        data: `xsrf_token=${shared.esgst.xsrfToken}&do=${wbm.key}&action=insert&child_user_id=${list[i]}`,
        method: `POST`,
        url: `/ajax.php`
      });
      window.setTimeout(() => this.wbm_insertUsers(wbm, list, ++i, n, callback), 0);
    } else {
      createFadeMessage(wbm.message, `List imported with success!`);
      callback();
    }
  }

  async wbm_exportList(wbm, list, nextPage, callback) {
    if (wbm.isCanceled) return;
    if (gSettings.wbm_useCache) {
      let steamId;
      for (steamId in shared.esgst.users.users) {
        if (shared.esgst.users.users.hasOwnProperty(steamId)) {
          if (shared.esgst.users.users[steamId][`${wbm.key}ed`]) {
            list.push(shared.esgst.users.users[steamId].id);
          }
        }
      }
      downloadFile(JSON.stringify(list), `esgst_${wbm.key}_${new Date().toISOString()}.json`);
      createFadeMessage(wbm.message, `List exported with success!`);
      callback();
    } else {
      createElements(wbm.message, `inner`, [{
        attributes: {
          class: `fa fa-circle-o-notch fa-spin`
        },
        type: `i`
      }, {
        text: `Retrieving list (page ${nextPage})...`,
        type: `span`
      }]);
      let elements, i, n, pagination, responseHtml;
      responseHtml = parseHtml((await request({
        method: `GET`,
        url: `https://www.steamgifts.com/account/manage/${wbm.key}/search?page=${nextPage}`
      })).responseText);
      elements = responseHtml.querySelectorAll(`[name="child_user_id"]`);
      for (i = 0, n = elements.length; i < n; ++i) {
        list.push(elements[i].value);
      }
      pagination = responseHtml.getElementsByClassName(`pagination__navigation`)[0];
      if (pagination && !pagination.lastElementChild.classList.contains(`is-selected`)) {
        window.setTimeout(() => this.wbm_exportList(wbm, list, ++nextPage, callback), 0);
      } else {
        downloadFile(JSON.stringify(list), `esgst_${wbm.key}_${new Date().toISOString()}.json`);
        createFadeMessage(wbm.message, `List exported with success!`);
        callback();
      }
    }
  }

  async wbm_clearList(wbm, list, nextPage, callback) {
    if (wbm.isCanceled) return;
    if (gSettings.wbm_useCache) {
      let steamId;
      for (steamId in shared.esgst.users.users) {
        if (shared.esgst.users.users.hasOwnProperty(steamId)) {
          let user = shared.esgst.users.users[steamId];
          if (user[`${wbm.key}ed`]) {
            if (gSettings.wbm_clearTags) {
              if (user.tags) {
                let i;
                for (i = user.tags.length - 1; i > -1 && gSettings.wbm_tags.indexOf(user.tags[i]) < 0; --i) {
                }
                if (i > -1) {
                  list.push(user.id);
                  wbm.usernames.push(user.username);
                }
              }
            } else {
              list.push(user.id);
            }
          }
        }
      }
      // noinspection JSIgnoredPromiseFromCall
      this.wbm_deleteUsers(wbm, list, 0, list.length, callback);
    } else {
      createElements(wbm.message, `inner`, [{
        attributes: {
          class: `fa fa-circle-o-notch fa-spin`
        },
        type: `i`
      }, {
        text: `Retrieving list (page ${nextPage})...`,
        type: `span`
      }]);
      let element, elements, i, n, pagination, responseHtml;
      responseHtml = parseHtml((await request({
        method: `GET`,
        url: `https://www.steamgifts.com/account/manage/${wbm.key}/search?page=${nextPage}`
      })).responseText);
      elements = responseHtml.querySelectorAll(`[name="child_user_id"]`);
      for (i = 0, n = elements.length; i < n; ++i) {
        element = elements[i];
        if (gSettings.wbm_clearTags) {
          let steamId, username;
          username = element.closest(`.table__row-inner-wrap`).getElementsByClassName(`table__column__heading`)[0].textContent;
          steamId = shared.esgst.users.steamIds[username];
          if (steamId) {
            let user = shared.esgst.users.users[steamId];
            if (user.tags) {
              let j;
              for (j = user.tags.length - 1; j > -1 && gSettings.wbm_tags.indexOf(user.tags[j]) < 0; --j) {
              }
              if (j > -1) {
                list.push(element.value);
                wbm.usernames.push(username);
              }
            }
          }
        } else {
          list.push(element.value);
        }
      }
      pagination = responseHtml.getElementsByClassName(`pagination__navigation`)[0];
      if (pagination && !pagination.lastElementChild.classList.contains(`is-selected`)) {
        window.setTimeout(() => this.wbm_clearList(wbm, list, ++nextPage, callback), 0);
      } else {
        // noinspection JSIgnoredPromiseFromCall
        this.wbm_deleteUsers(wbm, list, 0, list.length, callback);
      }
    }
  }

  async wbm_deleteUsers(wbm, list, i, n, callback) {
    if (wbm.isCanceled) return;
    createElements(wbm.message, `inner`, [{
      attributes: {
        class: `fa fa-circle-o-notch fa-spin`
      },
      type: `i`
    }, {
      text: `Clearing list (${i} of ${n})...`,
      type: `span`
    }]);
    if (i < n) {
      await request({
        data: `xsrf_token=${shared.esgst.xsrfToken}&do=${wbm.key}&action=delete&child_user_id=${list[i]}`,
        method: `POST`,
        url: `/ajax.php`
      });
      window.setTimeout(() => this.wbm_deleteUsers(wbm, list, ++i, n, callback), 0);
    } else {
      createFadeMessage(wbm.message, `List cleared with success!`);
      createElements(wbm.results, `inner`, [{
        attributes: {
          class: `esgst-bold`
        },
        text: `Users cleared (${wbm.usernames.length}):`,
        type: `span`
      }, {
        attributes: {
          class: `esgst-popup-actions`
        },
        type: `span`
      }]);
      wbm.usernames.forEach(username => {
        createElements(wbm.results.lastElementChild, `beforeEnd`, [{
          attributes: {
            href: `/user/${username}`
          },
          text: username,
          type: `a`
        }]);
      });
      callback();
    }
  }
}

const usersWhitelistBlacklistManager = new UsersWhitelistBlacklistManager();

export { usersWhitelistBlacklistManager };