import { Checkbox } from '../class/Checkbox';
import { Module } from '../class/Module';
import { Popup } from '../class/Popup';
import { utils } from '../lib/jsUtils';
import { common } from './Common';
import { gSettings } from '../class/Globals';

const
  sortArray = utils.sortArray.bind(utils),
  createElements = common.createElements.bind(common),
  formatTags = common.formatTags.bind(common),
  lockAndSaveDiscussions = common.lockAndSaveDiscussions.bind(common),
  lockAndSaveGames = common.lockAndSaveGames.bind(common),
  lockAndSaveGroups = common.lockAndSaveGroups.bind(common),
  getFeatureTooltip = common.getFeatureTooltip.bind(common),
  getUser = common.getUser.bind(common),
  getValue = common.getValue.bind(common),
  saveUser = common.saveUser.bind(common),
  saveUsers = common.saveUsers.bind(common),
  setSetting = common.setSetting.bind(common),
  triggerSetOnEnter = common.triggerSetOnEnter.bind(common)
;

class Tags extends Module {
  constructor(id) {
    super();
    this.id = id;
  }

  async tags_getTags() {
    const allTags = [];
    switch (this.id) {
      case `dt`: {
        const savedDiscussions = JSON.parse(getValue(`discussions`));
        for (const id in savedDiscussions) {
          if (savedDiscussions.hasOwnProperty(id)) {
            const tags = savedDiscussions[id].tags;
            if (tags && Array.isArray(tags)) {
              allTags.push(...tags);
            }
          }
        }
        break;
      }
      case `gpt`: {
        const savedGroups = JSON.parse(getValue(`groups`));
        for (const group of savedGroups) {
          const tags = group.tags;
          if (tags && Array.isArray(tags)) {
            allTags.push(...tags);
          }
        }
        break;
      }
      case `gt`: {
        const savedGames = JSON.parse(getValue(`games`));
        for (const id in savedGames.apps) {
          if (savedGames.apps.hasOwnProperty(id)) {
            const tags = savedGames.apps[id].tags;
            if (tags && Array.isArray(tags)) {
              allTags.push(...tags);
            }
          }
        }
        for (const id in savedGames.subs) {
          if (savedGames.subs.hasOwnProperty(id)) {
            const tags = savedGames.subs[id].tags;
            if (tags && Array.isArray(tags)) {
              allTags.push(...tags);
            }
          }
        }
        break;
      }
      case `ut`: {
        const savedUsers = JSON.parse(getValue(`users`));
        for (const id in savedUsers.users) {
          if (savedUsers.users.hasOwnProperty(id)) {
            const tags = savedUsers.users[id].tags;
            if (tags && Array.isArray(tags)) {
              allTags.push(...tags);
            }
          }
        }
        break;
      }
    }
    const tagCount = {};
    for (const tag of allTags) {
      if (!tagCount[tag]) {
        tagCount[tag] = 0;
      }
      tagCount[tag] += 1;
    }
    this.esgst[`${this.id}Tags`] = [];
    for (const tag in tagCount) {
      if (tagCount.hasOwnProperty(tag)) {
        this.esgst[`${this.id}Tags`].push({
          count: tagCount[tag],
          tag
        });
      }
    }
    this.esgst[`${this.id}Tags`] = sortArray(this.esgst[`${this.id}Tags`], true, `count`).map(x => x.tag);
    if (gSettings[`${this.id}_s`]) {
      this.esgst.documentEvents.keydown.add(this.tags_navigateSuggestions.bind(this));
      this.esgst.documentEvents.click.add(this.tags_closeSuggestions.bind(this));
    }
  }

  tags_navigateSuggestions(event) {
    if (!event.key.match(/^(ArrowDown|ArrowUp|Enter)$/) || event.repeat) {
      return;
    }
    const selected = document.querySelector(`.esgst-tag-suggestion.esgst-selected`);
    let element = null;
    if (selected) {
      if (event.key === `ArrowDown`) {
        element = selected.nextElementSibling;
        while (element && element.classList.contains(`esgst-hidden`)) {
          element = element.nextElementSibling;
        }
      } else if (event.key === `ArrowUp`) {
        element = selected.previousElementSibling;
        while (element && element.classList.contains(`esgst-hidden`)) {
          element = element.previousElementSibling;
        }
      } else if (event.key === `Enter`) {
        event.stopPropagation();
        selected.click();
      }
      selected.classList.remove(`esgst-selected`);
      if (element) {
        element.classList.add(`esgst-selected`);
      }
    } else if (event.key !== `Enter`) {
      element = document.querySelector(`.esgst-tag-suggestion:not(.esgst-hidden)`);
      if (element) {
        element.classList.add(`esgst-selected`);
      }
    }
  }

  tags_closeSuggestions(event) {
    const suggestions = document.querySelector(`.esgst-tag-suggestions:not(.esgst-hidden)`);
    if (suggestions && !suggestions.contains(event.target) && event.target.tagName !== `INPUT`) {
      this.tags_hideSuggestions(suggestions);
    }
  }

  tags_hideSuggestions(suggestions) {
    suggestions.classList.add(`esgst-hidden`);
    for (const item of suggestions.children) {
      item.classList.remove(`esgst-selected`);
    }
  }

  async tags_addButtons(items) {
    items = items.all || items;
    for (const item of items) {
      const obj = {item, key: this.id, colorSetting: gSettings[`${this.id}_colors`]};
      if (!item.container.getElementsByClassName(`esgst-tag-button`)[0]) {
        createElements(item.tagContext, item.tagPosition, [{
          attributes: {
            class: `esgst-tag-button esgst-faded`,
            [`data-draggable-id`]: this.id,
            title: getFeatureTooltip(this.id, `Edit tags`)
          },
          type: `a`,
          children: [{
            attributes: {
              class: `fa fa-tag`
            },
            type: `i`
          }, {
            attributes: {
              class: `esgst-tags`
            },
            type: `span`
          }]
        }]).addEventListener(`click`, this.tags_openPopup.bind(this, obj), true);
      }
      if (item.saved && item.saved.tags) {
        item.tags = item.saved.tags.map(tag => tag.toLowerCase());
        await this.tags_addTags(item, obj, item.saved.tags);
      }
    }
  }

  async tags_openMmPopup(mmObj, items) {
    const key = {
      Discussions: `dt`,
      Games: `gt`,
      Groups: `gpt`,
      Users: `ut`
    }[this.id];
    const obj = {items: [], key};
    obj.items = sortArray(items.filter(item => item.mm && (item.outerWrap.offsetParent || item.outerWrap.closest(`.esgst-gv-container:not(.is-hidden):not(.esgst-hidden)`))), false, `code`);
    const savedDiscussions = JSON.parse(getValue(`discussions`));
    const savedGames = JSON.parse(getValue(`games`));
    const savedGroups = JSON.parse(getValue(`groups`));
    const savedUsers = JSON.parse(getValue(`users`));
    for (const item of obj.items) {
      item.tags = [];
      item.uniqueTags = [];
      switch (key) {
        case `dt`: {
          const discussion = savedDiscussions[item.code];
          if (discussion && discussion.tags && Array.isArray(discussion.tags)) {
            item.tags = discussion.tags;
          }
          break;
        }
        case `gpt`: {
          const group = savedGroups.filter(subGroup => subGroup.code === item.code)[0];
          if (group && group.tags && Array.isArray(group.tags)) {
            item.tags = group.tags;
          }
          break;
        }
        case `gt`: {
          const game = savedGames[item.type][item.code];
          if (game && game.tags && Array.isArray(game.tags)) {
            item.tags = game.tags;
          }
          break;
        }
        case `ut`: {
          const user = await getUser(savedUsers, {username: item.code});
          if (user && user.tags && Array.isArray(user.tags)) {
            item.tags = user.tags;
          }
          break;
        }
      }
    }
    obj.hasUnique = false;
    obj.sharedTags = new Set();
    for (const item of obj.items) {
      for (const tag of item.tags) {
        if (obj.items.length === obj.items.filter(subItem => subItem.tags.indexOf(tag) > -1).length) {
          obj.sharedTags.add(tag);
        } else {
          obj.hasUnique = true;
          item.uniqueTags.push(tag);
        }
      }
    }
    if (obj.hasUnique) {
      obj.sharedTags.add(`[*]`);
    }
    obj.sharedTags = Array.from(obj.sharedTags);
    // noinspection JSIgnoredPromiseFromCall
    this.tags_openPopup(obj);
  }

  async tags_openPopup(obj, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    obj.popup = new Popup({
      addScrollable: true,
      buttons: [{
        color1: `green`,
        color2: `grey`,
        icon1: `fa-check`,
        icon2: `fa-circle-o-notch fa-spin`,
        title1: `Save`,
        title2: `Saving...`,
        callback1: this.tags_saveTags.bind(this, obj)
      }],
      icon: `fa-tag`,
      isTemp: true,
      title: [
        `Edit tags for `,
        [`span`, (obj.items && `${obj.items.length} items`) || obj.item.name || obj.item.id],
        `:`
      ]
    });
    createElements(obj.popup.description, `beforeEnd`, [{
      attributes: {
        class: `esgst-description`
      },
      type: `div`,
      children: [{
        text: `Drag the tags to move them.`,
        type: `p`
      }, {
        type: `br`
      }, {
        text: `When editing a tag color, it will also alter the color for all items with that tag (you have to refresh the page for it to take effect).`,
        type: `p`
      }, ...(obj.hasUnique ? [{
        type: `br`
      }, {
        text: `[*] means that there are tags that are not shared between all items. If you delete the [*] tag, those unique tags will be deleted.`,
        type: `p`
      }] : [])]
    }]);
    obj.tags = createElements(obj.popup.description, `beforeEnd`, [{
      attributes: {
        class: `esgst-tags`
      },
      type: `div`
    }]);
    obj.input = createElements(obj.popup.description, `beforeEnd`, [{
      attributes: {
        type: `text`
      },
      events: {
        focus: this.tags_createTags.bind(this, obj),
        input: this.tags_createTags.bind(this, obj),
        keydown: triggerSetOnEnter.bind(this, obj.popup.buttons[0])
      },
      type: `input`
    }]);
    createElements(obj.popup.description, `beforeEnd`, [{
      attributes: {
        class: `esgst-tag-list-button esgst-clickable fa fa-list`,
        title: `Select from existing tags`
      },
      type: `i`
    }]).addEventListener(`click`, this.tags_showTagList.bind(this, obj));
    const children = [];
    if (gSettings[`${obj.key}_s`]) {
      obj.suggestions = createElements(obj.popup.description, `beforeEnd`, [{
        attributes: {
          class: `esgst-tag-suggestions esgst-hidden`
        },
        type: `div`
      }]);
      for (const tag of this.esgst[`${obj.key}Tags`]) {
        children.push({
          attributes: {
            class: `esgst-tag-suggestion esgst-hidden`
          },
          events: {
            click: this.tags_addSuggestion.bind(this, obj),
            mouseenter: this.tags_selectSuggestion,
            mouseleave: this.tags_unselectSuggestion
          },
          text: tag,
          type: `div`
        });
      }
      createElements(obj.suggestions, `inner`, children);
    }
    createElements(obj.popup.description, `beforeEnd`, [{
      attributes: {
        class: `esgst-description`
      },
      text: `Use commas to separate tags, for example: Tag1, Tag2, ...`,
      type: `div`
    }]);
    obj.popup.description.appendChild(obj.popup.buttons[0].set);
    obj.popup.open(this.tags_loadTags.bind(this, obj));
  }

  async tags_saveTags(obj) {
    let tags = obj.input.value.replace(/(,\s*)+/g, formatTags).split(`, `);
    if (tags.length === 1 && !tags[0].trim()) {
      tags = ``;
    }
    switch (obj.key) {
      case `dt`: {
        const discussions = {};
        if (obj.items) {
          for (const item of obj.items) {
            item.multiTags = tags;
            if (tags) {
              const index = tags.indexOf(`[*]`);
              if (index > -1) {
                item.multiTags = [...tags];
                item.multiTags.splice(index, 1, ...item.uniqueTags);
              }
            }
            discussions[item.code] = {
              name: item.name,
              tags: item.multiTags
            };
          }
        } else {
          discussions[obj.item.id] = {
            name: obj.item.name,
            tags
          };
        }
        await lockAndSaveDiscussions(discussions);
        break;
      }
      case `gpt`: {
        const groups = {};
        if (obj.items) {
          for (const item of obj.items) {
            item.multiTags = tags;
            if (tags) {
              const index = tags.indexOf(`[*]`);
              if (index > -1) {
                item.multiTags = [...tags];
                item.multiTags.splice(index, 1, ...item.uniqueTags);
              }
            }
            groups[item.code] = {
              code: item.code,
              name: item.name,
              tags: item.multiTags
            };
          }
        } else {
          groups[obj.item.id] = {
            code: obj.item.id,
            name: obj.item.name,
            tags
          };
        }
        await lockAndSaveGroups(groups);
        break;
      }
      case `gt`: {
        const games = {apps: {}, subs: {}};
        if (obj.items) {
          for (const item of obj.items) {
            item.multiTags = tags;
            if (tags) {
              const index = tags.indexOf(`[*]`);
              if (index > -1) {
                item.multiTags = [...tags];
                item.multiTags.splice(index, 1, ...item.uniqueTags);
              }
            }
            games[item.type][item.code] = {tags: item.multiTags};
          }
        } else {
          games[obj.item.type][obj.item.id] = {tags};
        }
        await lockAndSaveGames(games);
        break;
      }
      case `ut`: {
        if (obj.items) {
          const users = [];
          for (const item of obj.items) {
            item.multiTags = tags;
            if (tags) {
              const index = tags.indexOf(`[*]`);
              if (index > -1) {
                item.multiTags = [...tags];
                item.multiTags.splice(index, 1, ...item.uniqueTags);
              }
            }
            users.push({
              steamId: item.sg ? null : item.code,
              username: item.sg ? item.code : null,
              values: {
                tags: item.multiTags
              }
            });
          }
          await saveUsers(users);
        } else {
          const user = {
            steamId: obj.item.steamId,
            username: obj.item.username,
            values: {tags}
          };
          await saveUser(null, null, user);
        }
        break;
      }
    }
    await setSetting(`${obj.key}_colors`, obj.colorSetting);
    if (obj.items) {
      for (const item of obj.items) {
        await this.tags_addTags(item, obj, item.multiTags);
      }
    } else {
      await this.tags_addTags(obj.item, obj, tags);
    }
    obj.popup.close();
  }

  async tags_addTags(item, obj, tags) {
    let items = null;
    switch (obj.key) {
      case `dt`:
        items = [];
        for (const scopeKey in this.esgst.scopes) {
          const scope = this.esgst.scopes[scopeKey];
          items = items.concat(scope.discussions.filter(discussion => discussion.code === item.code || discussion.code === item.id));
        }
        break;
      case `gpt`:
        items = this.esgst.currentGroups[item.code || item.id].elements;
        break;
      case `gt`:
        items = (await this.esgst.modules.games.games_get(document, true, this.esgst.games))[item.type][item.id || item.code];
        break;
      case `ut`:
        items = this.esgst.currentUsers[item.code || item.id].elements;
        break;
    }
    if (!items) {
      return;
    }
    const elements = tags.length && tags[0] ? tags.map(x => this.tags_template(x)) : [{
      text: ``,
      type: `node`
    }];
    for (const subItem of items) {
      let context = null;
      switch (obj.key) {
        case `dt`:
          context = subItem.container;
          break;
        case `gpt`:
          context = subItem.parentElement;
          break;
        case `gt`:
          context = subItem.container;
          break;
        case `ut`: {
          const container = subItem.parentElement;
          if (!container) {
            break;
          }
          context = container.classList.contains(`comment__username`) ? container : subItem;
          context = context.parentElement;
          break;
        }
      }
      if (!context) {
        continue;
      }
      const button = context.getElementsByClassName(`esgst-tag-button`)[0];
      if (!button) {
        continue;
      }
      button.classList[elements ? `remove` : `add`](`esgst-faded`);
      const tagsContainer = button.lastElementChild;
      createElements(tagsContainer, `inner`, elements);
      for (const tagsBox of tagsContainer.children) {
        const colors = obj.colorSetting[tagsBox.textContent];
        if (!colors) {
          continue;
        }
        tagsBox.style.color = colors.color;
        tagsBox.style.backgroundColor = colors.bgColor;
      }
    }
  }

  tags_template(text) {
    return {
      attributes: {
        class: `esgst-tag global__image-outer-wrap author_avatar is_icon`
      },
      text,
      type: `span`
    };
  }

  tags_createTags(obj) {
    obj.tags.innerHTML = ``;
    const tags = obj.input.value.replace(/(,\s*)+/g, formatTags).split(`, `).filter(x => x);
    if (tags.length) {
      if (gSettings[`${obj.key}_s`]) {
        if (obj.input.value.slice(-1).match(/\s|,/)) {
          this.tags_hideSuggestions(obj.suggestions);
        } else {
          const lastTag = tags[tags.length - 1].toLowerCase();
          let selected = document.querySelector(`.esgst-tag-suggestion.esgst-selected`);
          if (selected) {
            selected.classList.remove(`esgst-selected`);
          }
          selected = null;
          for (const child of obj.suggestions.children) {
            const value = child.textContent.toLowerCase();
            if (value !== lastTag && value.match(new RegExp(`^${lastTag}`))) {
              child.classList.remove(`esgst-hidden`);
              if (!selected) {
                selected = child;
              }
            } else {
              child.classList.add(`esgst-hidden`);
            }
          }
          if (selected) {
            obj.suggestions.classList.remove(`esgst-hidden`);
          } else {
            this.tags_hideSuggestions(obj.suggestions);
          }
        }
      }
      for (const tag of tags) {
        this.tags_createTag(obj, tag);
      }
    } else if (gSettings[`${obj.key}_s`]) {
      this.tags_hideSuggestions(obj.suggestions);
    }
  }

  tags_createTag(obj, tag) {
    const container = createElements(obj.tags, `beforeEnd`, [{
      attributes: {
        class: `esgst-tag-preview`,
        draggable: true
      },
      type: `div`,
      children: [{
        attributes: {
          class: `esgst-tags`
        },
        type: `div`,
        children: [{
          attributes: {
            class: `esgst-tag global__image-outer-wrap author_avatar is_icon`
          },
          text: tag,
          type: `span`
        }]
      }, {
        attributes: {
          class: `esgst-hidden`,
          type: `text`
        },
        type: `input`
      }, {
        attributes: {
          title: `Set text color for this tag`,
          type: `color`
        },
        type: `input`
      }, {
        attributes: {
          title: `Set background color for this tag`,
          type: `color`
        },
        type: `input`
      }, {
        attributes: {
          class: `esgst-clickable fa fa-edit`,
          title: `Edit tag`
        },
        type: `i`
      }, {
        attributes: {
          class: `esgst-clickable fa fa-trash`,
          title: `Delete tag`
        },
        type: `i`
      }, {
        attributes: {
          class: `esgst-clickable fa fa-rotate-left`,
          title: `Reset tag color`
        },
        type: `i`
      }]
    }]);
    const tagContainer = container.firstElementChild;
    const tagBox = tagContainer.firstElementChild;
    const input = tagContainer.nextElementSibling;
    const colorInput = input.nextElementSibling;
    const bgColorInput = colorInput.nextElementSibling;
    const editButton = bgColorInput.nextElementSibling;
    const deleteButton = editButton.nextElementSibling;
    const resetButton = deleteButton.nextElementSibling;
    const colors = obj.colorSetting[tag];
    if (colors) {
      colorInput.value = tagBox.style.color = colors.color;
      bgColorInput.value = tagBox.style.backgroundColor = colors.bgColor;
    }
    container.addEventListener(`dragstart`, this.tags_startDrag.bind(this, container, obj));
    container.addEventListener(`dragenter`, this.tags_continueDrag.bind(this, container, obj));
    container.addEventListener(`dragend`, this.tags_endDrag.bind(this, obj));
    input.addEventListener(`keydown`, this.tags_editTag.bind(this, bgColorInput, colorInput, input, obj, tagBox, tagContainer));
    colorInput.addEventListener(`change`, this.tags_saveColor.bind(this, colorInput, `color`, obj, `color`, tagBox));
    bgColorInput.addEventListener(`change`, this.tags_saveColor.bind(this, bgColorInput, `backgroundColor`, obj, `bgColor`, tagBox));
    editButton.addEventListener(`click`, this.tags_showEdit.bind(this, input, tagBox, tagContainer));
    deleteButton.addEventListener(`click`, this.tags_deleteTag.bind(this, container, obj));
    resetButton.addEventListener(`click`, this.tags_resetColor.bind(this, bgColorInput, colorInput, obj, tagBox));
  }

  tags_startDrag(container, obj, event) {
    event.dataTransfer.setData(`text/plain`, ``);
    obj.dragged = container;
  }

  tags_continueDrag(container, obj) {
    let current;
    current = obj.dragged;
    do {
      current = current.previousElementSibling;
      if (current && current === container) {
        obj.tags.insertBefore(obj.dragged, container);
        return;
      }
    } while (current);
    obj.tags.insertBefore(obj.dragged, container.nextElementSibling);
  }

  tags_endDrag(obj) {
    const tags = [];
    for (const element of obj.tags.children) {
      tags.push(element.firstElementChild.firstElementChild.textContent);
    }
    obj.input.value = tags.join(`, `);
  }

  tags_editTag(bgColorInput, colorInput, input, obj, tagBox, tagContainer, event) {
    if (event.key !== `Enter`) {
      return;
    }
    tagContainer.classList.remove(`esgst-hidden`);
    input.classList.add(`esgst-hidden`);
    const tag = input.value;
    tagBox.textContent = tag;
    const colors = obj.colorSetting[tag];
    if (colors) {
      colorInput.value = tagBox.style.color = colors.color;
      bgColorInput.value = tagBox.style.backgroundColor = colors.bgColor;
    }
    this.tags_endDrag(obj);
  }

  tags_saveColor(input, key, obj, saveKey, tagBox) {
    const tag = tagBox.textContent;
    if (!obj.colorSetting[tag]) {
      obj.colorSetting[tag] = {
        bgColor: ``,
        color: ``
      };
    }
    obj.colorSetting[tag][saveKey] = tagBox.style[key] = input.value;
  }

  tags_showEdit(input, tagBox, tagContainer) {
    tagContainer.classList.add(`esgst-hidden`);
    input.classList.remove(`esgst-hidden`);
    input.value = tagBox.textContent;
    input.focus();
  }

  tags_deleteTag(container, obj) {
    container.remove();
    this.tags_endDrag(obj);
  }

  tags_resetColor(bgColorInput, colorInput, obj, tagBox) {
    bgColorInput.value = ``;
    colorInput.value = ``;
    tagBox.style.backgroundColor = ``;
    tagBox.style.color = ``;
    delete obj.colorSetting[tagBox.textContent];
  }

  async tags_showTagList(obj) {
    obj.listPopup = new Popup({
      addScrollable: true,
      buttons: [{
        color1: `green`,
        color2: ``,
        icon1: `fa-check`,
        icon2: ``,
        title1: `Add Tags`,
        title2: ``,
        callback1: this.tags_addTagsFromList.bind(this, obj)
      }],
      icon: `fa-list`,
      isTemp: true,
      title: `Select from existing tags:`
    });
    const list = createElements(obj.listPopup.scrollable, `beforeEnd`, [{
      attributes: {
        class: `esgst-tag-list popup__keys__list`
      },
      type: `div`
    }]);
    obj.selectedTags = [];
    for (const tag of this.esgst[`${obj.key}Tags`]) {
      const item = createElements(list, `beforeEnd`, [{
        type: `div`,
        children: [{
          type: `span`
        }, {
          text: ` ${tag}`,
          type: `node`
        }]
      }]);
      if (obj.colorSetting[tag]) {
        item.style.color = obj.colorSetting[tag].color;
        item.style.backgroundColor = obj.colorSetting[tag].bgColor;
      }
      const checkbox = new Checkbox(item);
      checkbox.onEnabled = this.tags_selectTag.bind(this, obj, tag);
      checkbox.onDisabled = this.tag_unselectTag.bind(this, obj, tag);
    }
    obj.listPopup.open();
  }

  tags_addTagsFromList(obj) {
    for (const tag of obj.selectedTags) {
      this.tags_createTag(obj, tag);
    }
    if (obj.input.value) {
      obj.selectedTags.unshift(obj.input.value);
    }
    obj.input.value = obj.selectedTags.join(`, `);
    obj.listPopup.close();
  }

  tags_selectTag(obj, tag) {
    obj.selectedTags.push(tag);
  }

  tag_unselectTag(obj, tag) {
    obj.selectedTags.splice(obj.selectedTags.indexOf(tag), 1);
  }

  /**
   * @param event
   */
  tags_addSuggestion(obj, event) {
    obj.tags.innerHTML = ``;
    const tags = obj.input.value.replace(/(,\s*)+/g, formatTags).split(`, `);
    const value = event.currentTarget.textContent;
    tags.pop();
    tags.push(value);
    obj.input.value = tags.join(`, `);
    this.tags_hideSuggestions(obj.suggestions);
    for (const tag of tags) {
      this.tags_createTag(obj, tag);
    }
    obj.input.focus();
  }

  tags_selectSuggestion(event) {
    for (const item of event.currentTarget.parentElement.children) {
      item.classList.remove(`esgst-selected`);
    }
    event.currentTarget.classList.add(`esgst-selected`);
  }

  tags_unselectSuggestion(event) {
    const parent = event.currentTarget.parentElement;
    if (event.relatedTarget !== parent && parent.contains(event.relatedTarget)) {
      event.currentTarget.classList.remove(`esgst-selected`);
    }
  }

  async tags_loadTags(obj) {
    let item = null;
    if (obj.items) {
      item = {tags: obj.sharedTags};
    } else {
      switch (obj.key) {
        case `dt`: {
          const savedDiscussions = JSON.parse(getValue(`discussions`));
          item = savedDiscussions[obj.item.id];
          break;
        }
        case `gpt`: {
          const savedGroups = JSON.parse(getValue(`groups`));
          item = savedGroups.filter(group => group.code === obj.item.id)[0];
          break;
        }
        case `gt`: {
          const savedGames = JSON.parse(getValue(`games`));
          item = savedGames[obj.item.type][obj.item.id];
          break;
        }
        case `ut`: {
          item = await getUser(null, {
            steamId: obj.item.steamId,
            username: obj.item.username
          });
          break;
        }
      }
    }
    obj.input.focus();
    if (!item || !item.tags) {
      return;
    }
    obj.tags.innerHTML = ``;
    for (const tag of item.tags) {
      this.tags_createTag(obj, tag);
    }
    obj.input.value = item.tags.join(`, `);
  }
}

export { Tags };