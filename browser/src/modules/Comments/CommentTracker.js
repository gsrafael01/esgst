import { Button } from '../../class/Button';
import { Module } from '../../class/Module';
import { utils } from '../../lib/jsUtils';
import { shared } from '../../class/Shared';
import { gSettings } from '../../class/Globals';

class CommentsCommentTracker extends Module {
  constructor() {
    super();
    this.info = {
      description: [
        ['ul', [
          ['li', `Keeps track of any comments (in any page) and fades out comments that you have marked as read so that you can easily see which comments you have read/unread in the page.`],
          ['li', 'Comments made by yourself are automatically marked as read.'],
          ['li', `The comments are tracked by saving the date when they were made. If a comment is edited then the date when it was last edited is saved instead, so if you had previously marked a comment as read and that comment was edited, it will now appear as unread.`],
          ['li', [
            'Adds a panel to the "Comments" column of any ',
            ['a', { href: `https://www.steamgifts.com/discussions` }, 'discussions'],
            '/',
            ['a', { href: `https://www.steamgifts.com/support/tickets` }, 'tickets'],
            '/',
            ['a', { href: `https://www.steamtrades.com/trades` }, 'trades'],
            ` pages and to the main page heading of any page containing:`
          ]],
          ['ul', [
            ['li', 'A red number in parenthesis indicating how many unread comments there are in the thread.'],
            ['li', [
              `A button (`,
              ['i', { class: 'fa fa-comments' }],
              `) that allows you to go to the first unread comment of the thread/page.`
            ]],
            ['li', [
              `A button (`,
              ['i', { class: 'fa fa-eye' }],
              `) that allows you to mark every comment in the thread/page as read.`
            ]],
            ['li', [
              `A button (`,
              ['i', { class: 'fa fa-eye-slash' }],
              `) that allows you to mark every comment in the thread/page as unread.`
            ]]
          ]],
          ['li', `Adds a panel next a comment's "Permalink" (in any page) containing:`],
          ['ul', [
            ['li', [
              `A button (`,
              ['i', { class: 'fa fa-eye' }],
              `) that allows you to mark the comment as read.`
            ]],
            ['li', [
              `A button (`,
              ['i', { class: 'fa fa-eye-slash' }],
              `) that allows you to mark the comment as unread.`
            ]],
            ['li', [
              `A button (`,
              ['i', { class: 'fa fa-eye' }],
              ' ',
              ['i', { class: 'fa fa-angle-double-right' }],
              `) that allows you to mark the comment as read and go to the next unread comment.`
            ]],
            ['li', [
              `A button (`,
              ['i', { class: 'fa fa-eye' }],
              ' ',
              ['i', { class: 'fa fa-angle-up' }],
              `) that allows you to mark every comment from the comment upward as read.`
            ]],
            ['li', [
              `A button (`,
              ['i', { class: 'fa fa-eye-slash' }],
              ' ',
              ['i', { class: 'fa fa-angle-up' }],
              `) that allows you to mark every comment from the comment upward as unread.`
            ]]
          ]]
        ]]
      ],
      features: {
        ct_a: {
          name: 'Automatically mark comments as read in the inbox page when clicking on the "Mark as Read" button.',
          sg: true,
          st: true
        },
        ct_o: {
          name: 'Automatically mark your own comments as read.',
          sg: true,
          st: true
        },
        ct_c: {
          name: 'Enable tracking controls for your own comments.',
          sg: true,
          st: true
        },
        ct_s: {
          description: [
            ['ul', [
              ['li', `The simplified version of the tracker does not have the concept of read/unread comments, but simply shows the red number of comments that were made since you last visited a thread, so the comments are not tracked by date (they are tracked by quantity) and there are no buttons to go to the first unread comment of a thread/page or mark comments as read/unread.`],
              ['li', `If you mark a thread as visited with [id=gdttt], all of the comments in the thread will be considered as "read", and if you mark it as unvisited, they will be considered as "unread".`]
            ]]
          ],
          features: {
            ct_s_h: {
              description: [
                ['ul', [
                  ['li', 'Only shows the red number for a thread after you have visited it.']
                ]]
              ],
              name: 'Hide the counter if you have not visited the thread yet.',
              sg: true,
              st: true
            }
          },
          name: 'Enable the simplified version.',
          sg: true,
          st: true
        },
        ct_f: {
          name: 'Fade out read comments.',
          sg: true,
          st: true
        },
        ct_r: {
          description: [
            ['ul', [
              ['li', `Searches pages for an unread comment from the bottom to the top if [id=cr] is disabled or from the top to the bottom if it is enabled.`]
            ]]
          ],
          name: 'Search for the first unread comment in reverse order.',
          sg: true,
          st: true
        }
      },
      id: 'ct',
      name: 'Comment Tracker',
      sg: true,
      st: true,
      type: 'comments'
    };
  }

  async init() {
    if (((this.esgst.commentsPath && (!this.esgst.giveawayPath || !document.getElementsByClassName('table--summary')[0])) || shared.common.isCurrentPath('Messages')) && !gSettings.ct_s) {
      if (!gSettings.ct_s) {
        let button3 = shared.common.createHeadingButton({
          featureId: 'ct',
          id: 'ctUnread',
          icons: ['fa-eye-slash'],
          title: 'Mark all comments in this page as unread'
        });
        let button2 = shared.common.createHeadingButton({
          featureId: 'ct',
          id: 'ctRead',
          icons: ['fa-eye'],
          title: 'Mark all comments in this page as read'
        });
        let button1 = shared.common.createHeadingButton({
          featureId: 'ct',
          id: 'ctGo',
          icons: ['fa-comments-o'],
          title: 'Go to the first unread comment of this page'
        });
        this.ct_addCommentPanel(button1, button2, button3);
      }
      let match = window.location.pathname.match(/\/(giveaway|discussion|ticket|trade)\/(.+?)\//);
      if (match) {
        let code, count, diff, comments, element, type;
        element = this.esgst.mainPageHeading.querySelector(`.page__heading__breadcrumbs, .page_heading_breadcrumbs`).firstElementChild;
        type = `${match[1]}s`;
        code = match[2];
        comments = JSON.parse(shared.common.getValue(type));
        count = parseInt(element.textContent.replace(/,/g, '').match(/\d+/)[0]);
        if (comments[code]) {
          let id, read;
          if (gSettings.ct_s) {
            read = comments[code].count || (gSettings.ct_s_h ? count : 0);
          } else {
            read = 0;
            for (id in comments[code].readComments) {
              if (comments[code].readComments.hasOwnProperty(id)) {
                if (!id.match(/^(Count|undefined|)$/) && comments[code].readComments[id]) {
                  ++read;
                }
              }
            }
          }
          diff = count === read ? 0 : count - read;
        } else if (gSettings.ct_s && gSettings.ct_s_h) {
          diff = 0;
        } else {
          diff = count;
        }
        shared.common.createElements(element, 'beforeEnd', [{
          attributes: {
            class: 'esgst-ct-count',
            title: shared.common.getFeatureTooltip('ct', 'Unread comments')
          },
          text: ` (+${diff})`,
          type: 'span'
        }]);
      }
    }
  }

  /**
   * @param context
   * @param [main]
   * @param [source]
   * @param [endless]
   * @returns {Promise<void>}
   */
  async ct_addDiscussionPanels(context, main, source, endless) {
    let code, comments, count, countLink, diff, heading, i, id, j, match, matches, n, name, read, url, key;
    matches = context.querySelectorAll(`${endless ? `.esgst-es-page-${endless} .table__row-outer-wrap, .esgst-es-page-${endless}.table__row-outer-wrap` : '.table__row-outer-wrap'}, ${endless ? `.esgst-es-page-${endless} .row_outer_wrap, .esgst-es-page-${endless}.row_outer_wrap` : '.row_outer_wrap'}`);
    if (!matches.length) return;
    if (this.esgst.discussionsPath) {
      key = 'discussions';
    } else if (this.esgst.ticketsPath) {
      key = 'tickets';
    } else if (this.esgst.tradesPath) {
      key = 'trades';
    } else {
      key = 'discussions';
    }
    comments = JSON.parse(shared.common.getValue(key, '{}'));
    for (i = 0, n = matches.length; i < n; ++i) {
      match = matches[i];
      countLink = match.querySelector(`.table__column__secondary-link[href*="/discussion/"], .table__column--width-small.text-center, .column_small.text_center`);
      if (countLink) {
        count = parseInt(countLink.textContent.replace(/,/g, ''));
        heading = match.querySelector(`.homepage_table_column_heading, .table__column__heading, .column_flex h3 a`);
        name = heading.textContent.trim();
        url = heading.getAttribute('href');
        if (url) {
          code = url.match(new RegExp(`/${key.slice(0, -1)}/(.+?)(/.*)?$`));
          if (code) {
            code = code[1];
            if (gSettings.ust && key === 'tickets' && (!comments[code] || !comments[code].sent) && match.getElementsByClassName('table__column__secondary-link')[0].textContent.trim().match(/Request\sNew\sWinner|User\sReport/)) {
              this.esgst.modules.usersUserSuspensionTracker.ust_addCheckbox(code, match);
            }
            if (gSettings.gdttt || gSettings.ct) {
              if (comments[code]) {
                if (gSettings.ct_s) {
                  read = comments[code].count || (gSettings.ct_s_h ? count : 0);
                } else {
                  read = 0;
                  for (id in comments[code].readComments) {
                    if (comments[code].readComments.hasOwnProperty(id)) {
                      if (!id.match(/^(Count|undefined|)$/) && comments[code].readComments[id]) {
                        ++read;
                      }
                    }
                  }
                }
                diff = count === read ? 0 : count - read;
              } else if (gSettings.ct_s && gSettings.ct_s_h) {
                diff = 0;
              } else {
                diff = count;
              }
              let discussion = null;
              for (j = this.esgst.scopes.main.discussions.length - 1; j > -1 && this.esgst.scopes.main.discussions[j].code !== code; --j) {
              }
              if (j > -1) {
                discussion = this.esgst.scopes.main.discussions[j];
              }
              if (key === 'discussions' && diff > 0 && discussion) {
                discussion.unread = true;
              }
              this.ct_addDiscussionPanel(code, comments, match, countLink, count, diff, url, key, discussion, name);
            }
          }
        }
      }
    }
    if (main && shared.esgst.df && this.esgst.df.filteredCount && gSettings[`df_enable${this.esgst.df.type}`]) {
      this.esgst.modules.discussionsDiscussionFilters.filters_filter(this.esgst.df, false, endless);
    }
    if (this.esgst.ustButton) {
      if (this.esgst.modules.usersUserSuspensionTracker.numTickets > 0) {
        this.esgst.ustButton.classList.remove('esgst-hidden');
      } else {
        this.esgst.ustButton.classList.add('esgst-hidden');
      }
    }
  }

  async ct_getComments(count, comments, index, goToUnread, markRead, markUnread, endless) {
    let found = false;
    if (goToUnread) {
      found = await this.ct_checkComments(count, comments, index, true, false, false, endless);
    } else {
      let deleteLock;
      if (!endless) {
        deleteLock = await shared.common.createLock('commentLock', 300);
      }
      found = await this.ct_checkComments(count, comments, index, false, markRead, markUnread, endless);
      if (deleteLock) {
        deleteLock();
      }
    }
    return found;
  }

  async ct_checkComments(count, comments, index, goToUnread, markRead, markUnread, endless) {
    let code, comment, found, i, n, saved, source, type, unread;
    this.ctGoToUnread = false;
    let values;
    if (endless) {
      if (this.esgst.sg) {
        saved = {
          giveaways: this.esgst.giveaways,
          discussions: this.esgst.discussions,
          tickets: this.esgst.tickets
        };
      } else {
        saved = {
          trades: this.esgst.trades
        };
      }
    } else {
      values = shared.common.getValues({
        giveaways: '{}',
        discussions: '{}',
        tickets: '{}',
        trades: '{}'
      });
      if (this.esgst.sg) {
        saved = {
          giveaways: JSON.parse(values.giveaways),
          discussions: JSON.parse(values.discussions),
          tickets: JSON.parse(values.tickets)
        };
      } else {
        saved = {
          trades: JSON.parse(values.trades)
        };
      }
    }
    n = comments.length;
    found = false;
    if (n > 0) {
      for (i = index || 0; i < n; ++i) {
        comment = comments[i];
        if (comment.id || comment.id.match(/^$/)) {
          if (!saved[comment.type][comment.code]) {
            saved[comment.type][comment.code] = {
              readComments: {}
            };
          } else if (!saved[comment.type][comment.code].readComments) {
            saved[comment.type][comment.code].readComments = {};
          }
          if (count > 0) {
            saved[comment.type][comment.code].count = count;
          }
          if (gSettings.gdttt && gSettings[`gdttt_v${{
            giveaways: 'g',
            discussions: 'd',
            tickets: 't',
            trades: 'ts'
          }[comment.type]}`]) {
            saved[comment.type][comment.code].visited = true;
            let cache = JSON.parse(shared.common.getLocalValue('gdtttCache', `{"giveaways":[],"discussions":[],"tickets":[],"trades":[]}`));
            if (cache[comment.type].indexOf(comment.code) < 0) {
              cache[comment.type].push(comment.code);
              shared.common.setLocalValue('gdtttCache', JSON.stringify(cache));
            }
          }
          saved[comment.type][comment.code].lastUsed = Date.now();
          if (!gSettings.ct_s) {
            let buttons = comment.comment.getElementsByClassName('esgst-ct-comment-button');
            if (comment.author === gSettings.username) {
              if (gSettings.ct_c) {
                if (!saved[comment.type][comment.code].readComments[comment.id] || comment.timestamp !== saved[comment.type][comment.code].readComments[comment.id]) {
                  if (markRead) {
                    // noinspection JSIgnoredPromiseFromCall
                    this.ct_markCommentRead(comment, saved);
                    this.ct_addUnreadCommentButton(buttons[0], comment);
                  } else {
                    // noinspection JSIgnoredPromiseFromCall
                    this.ct_markCommentUnread(comment, saved);
                    this.ct_addReadCommentButton(buttons[0], comment);
                  }
                } else {
                  if (markUnread) {
                    // noinspection JSIgnoredPromiseFromCall
                    this.ct_markCommentUnread(comment, saved);
                    this.ct_addReadCommentButton(buttons[0], comment);
                  } else {
                    // noinspection JSIgnoredPromiseFromCall
                    this.ct_markCommentRead(comment, saved);
                    this.ct_addUnreadCommentButton(buttons[0], comment);
                  }
                }
                this.ct_addReadUntilHereButton(buttons[1], comment);
                this.ct_addUnreadUntilHereButton(buttons[2], comment);
              }
              if (gSettings.ct_o) {
                // noinspection JSIgnoredPromiseFromCall
                this.ct_markCommentRead(comment, saved);
                if (gSettings.ct_c) {
                  this.ct_addUnreadCommentButton(buttons[0], comment);
                }
              }
            } else if (!saved[comment.type][comment.code].readComments[comment.id] || comment.timestamp !== saved[comment.type][comment.code].readComments[comment.id]) {
              if (goToUnread && (!this.ctGoToUnread || ((((gSettings.ct_r && !gSettings.cr) || (!gSettings.ct_r && gSettings.cr)) && comment.comment.offsetTop < window.scrollY + this.esgst.commentsTop) || (((!gSettings.ct_r && !gSettings.cr) || (gSettings.ct_r && gSettings.cr)) && comment.comment.offsetTop > window.scrollY + this.esgst.commentsTop)))) {
                this.ctGoToUnread = true;
                if ((this.esgst.discussionPath && ((!gSettings.ct_r && !gSettings.cr) || (gSettings.ct_r && gSettings.cr))) || (!this.esgst.discussionPath && !gSettings.ct_r)) {
                  unread = comment;
                  found = true;
                } else {
                  if (this.esgst.discussionsPath) {
                    this.ctUnreadFound = true;
                    if (!this.ctNewTab && gSettings.sto) {
                      if (comment.id) {
                        window.location.href = `/go/comment/${comment.id}`;
                      } else {
                        window.location.href = `/discussion/${comment.code}/`;
                      }
                    } else {
                      if (comment.id) {
                        window.open(`/go/comment/${comment.id}`);
                      } else {
                        window.open(`/discussion/${comment.code}/`);
                      }
                    }
                  } else {
                    shared.common.goToComment(comment.id, comment.comment);
                  }
                  found = true;
                  break;
                }
              } else {
                if (markRead) {
                  // noinspection JSIgnoredPromiseFromCall
                  this.ct_markCommentRead(comment, saved);
                  this.ct_addUnreadCommentButton(buttons[0], comment);
                } else {
                  // noinspection JSIgnoredPromiseFromCall
                  this.ct_markCommentUnread(comment, saved);
                  this.ct_addReadCommentButton(buttons[0], comment);
                }
                this.ct_addReadUntilHereButton(buttons[1], comment);
                this.ct_addUnreadUntilHereButton(buttons[2], comment);
              }
            } else {
              if (markUnread) {
                // noinspection JSIgnoredPromiseFromCall
                this.ct_markCommentUnread(comment, saved);
                this.ct_addReadCommentButton(buttons[0], comment);
              } else {
                // noinspection JSIgnoredPromiseFromCall
                this.ct_markCommentRead(comment, saved);
                this.ct_addUnreadCommentButton(buttons[0], comment);
              }
              this.ct_addReadUntilHereButton(buttons[1], comment);
              this.ct_addUnreadUntilHereButton(buttons[2], comment);
            }
          }
        }
      }
      if (!gSettings.ct_s && goToUnread) {
        if (unread) {
          if (this.esgst.discussionsPath) {
            this.ctUnreadFound = true;
            if (!this.ctNewTab && gSettings.sto) {
              if (unread.id) {
                window.location.href = `/go/comment/${unread.id}`;
              } else {
                window.location.href = `/discussion/${unread.code}/`;
              }
            } else {
              if (unread.id) {
                window.open(`/go/comment/${unread.id}`);
              } else {
                window.open(`/discussion/${unread.code}/`);
              }
            }
          } else {
            shared.common.goToComment(unread.id, unread.comment);
          }
        }
      } else {
        if (this.esgst.sg) {
          await Promise.all([
            shared.common.lock_and_save_giveaways(saved.giveaways),
            shared.common.lockAndSaveDiscussions(saved.discussions),
            shared.common.lockAndSaveTickets(saved.tickets)
          ]);
        } else {
          await shared.common.lockAndSaveTrades(saved.trades);
        }
      }
    } else {
      source = window.location.pathname.match(/(giveaway|discussion|trade|ticket)\/(.+?)(\/.*)?$/);
      if (source) {
        type = `${source[1]}s`;
        code = source[2];
        if (!saved[type][code]) {
          saved[type][code] = {
            readComments: {},
            visited: true
          };
        }
        if (count > 0) {
          saved[type][code].count = count;
        }
        saved[type][code].lastUsed = Date.now();
        await shared.common[`lock_and_save_${type}`]({ [code]: saved[type][code] });
      }
    }
    return found;
  }

  async ct_markCommentRead(comment, comments, save) {
    let count;
    if (save) {
      let deleteLock = await shared.common.createLock('commentLock', 300);
      comments = JSON.parse(shared.common.getValue(comment.type));
      if (comment.id && !comments[comment.code].readComments[comment.id] && this.esgst.commentsPath) {
        count = document.getElementsByClassName('esgst-ct-count')[0];
        count.textContent = ` (+${parseInt(count.textContent.match(/\d+/)[0]) - 1})`;
      }
      comments[comment.code].readComments[comment.id] = comment.timestamp;
      await shared.common.setValue(comment.type, JSON.stringify(comments));
      deleteLock();
      if (gSettings.ct_f) {
        comment.comment.classList.add('esgst-ct-comment-read');
        comment.comment.style.opacity = '0.5';
        shared.common.setHoverOpacity(comment.comment, '1', '0.5');
      }
    } else {
      if (comments) {
        if (comment.id && !comments[comment.type][comment.code].readComments[comment.id] && this.esgst.commentsPath) {
          count = document.getElementsByClassName('esgst-ct-count')[0];
          count.textContent = ` (+${parseInt(count.textContent.match(/\d+/)[0]) - 1})`;
        }
        comments[comment.type][comment.code].readComments[comment.id] = comment.timestamp;
      }
      if (gSettings.ct_f) {
        comment.comment.classList.add('esgst-ct-comment-read');
        comment.comment.style.opacity = '0.5';
        shared.common.setHoverOpacity(comment.comment, '1', '0.5');
      }
    }
  }

  async ct_markCommentUnread(comment, comments, save) {
    let count;
    if (save) {
      let deleteLock = await shared.common.createLock('commentLock', 300);
      comments = JSON.parse(shared.common.getValue(comment.type));
      if (comments[comment.code].readComments[comment.id]) {
        delete comments[comment.code].readComments[comment.id];
        if (comment.id && this.esgst.commentsPath) {
          count = document.getElementsByClassName('esgst-ct-count')[0];
          count.textContent = ` (+${parseInt(count.textContent.match(/\d+/)[0]) + 1})`;
        }
      }
      await shared.common.setValue(comment.type, JSON.stringify(comments));
      deleteLock();
      if (gSettings.ct_f) {
        comment.comment.classList.remove('esgst-ct-comment-read');
        comment.comment.style.opacity = '1';
        shared.common.setHoverOpacity(comment.comment, '1', '1');
      }
    } else {
      if (comments && comments[comment.type][comment.code].readComments[comment.id]) {
        if (comment.id && this.esgst.commentsPath) {
          count = document.getElementsByClassName('esgst-ct-count')[0];
          count.textContent = ` (+${parseInt(count.textContent.match(/\d+/)[0]) + 1})`;
        }
        delete comments[comment.type][comment.code].readComments[comment.id];
      }
      if (gSettings.ct_f) {
        comment.comment.classList.remove('esgst-ct-comment-read');
        comment.comment.style.opacity = '1';
        shared.common.setHoverOpacity(comment.comment, '1', '1');
      }
    }
  }

  ct_addReadUntilHereButton(button, comment) {
    if (!button) {
      button = shared.common.createElements(comment.actions, 'beforeEnd', [{
        attributes: {
          class: 'esgst-ct-comment-button',
          title: `${shared.common.getFeatureTooltip('ct', 'Mark all comments from this comment upwards as read')}`
        },
        type: 'div'
      }]);
    }
    shared.common.createElements(button, 'inner', [{
      type: 'span',
      children: [{
        attributes: {
          class: 'fa fa-eye'
        },
        type: 'i'
      }, {
        attributes: {
          class: 'fa fa-angle-up'
        },
        type: 'i'
      }]
    }]);
    button.firstElementChild.addEventListener('click', this.ct_readUntilHere.bind(this, button, comment));
  }

  async ct_readUntilHere(button, comment) {
    shared.common.createElements(button, 'inner', [{
      attributes: {
        class: 'fa fa-circle-o-notch fa-spin'
      },
      type: 'i'
    }]);
    await this.ct_getComments(0, this.esgst.scopes.main.comments, comment.index, false, true, false);
    this.ct_addReadUntilHereButton(button, comment);
  }

  ct_addUnreadUntilHereButton(button, comment) {
    if (!button) {
      button = shared.common.createElements(comment.actions, 'beforeEnd', [{
        attributes: {
          class: 'esgst-ct-comment-button',
          title: `${shared.common.getFeatureTooltip('ct', 'Mark all comments from this comment upwards as unread')}`
        },
        type: 'div'
      }]);
    }
    shared.common.createElements(button, 'inner', [{
      type: 'span',
      children: [{
        attributes: {
          class: 'fa fa-eye-slash'
        },
        type: 'i'
      }, {
        attributes: {
          class: 'fa fa-angle-up'
        },
        type: 'i'
      }]
    }]);
    button.firstElementChild.addEventListener('click', this.ct_unreadUntilHere.bind(this, button, comment));
  }

  async ct_unreadUntilHere(button, comment) {
    shared.common.createElements(button, 'inner', [{
      attributes: {
        class: 'fa fa-circle-o-notch fa-spin'
      },
      type: 'i'
    }]);
    await this.ct_getComments(0, this.esgst.scopes.main.comments, comment.index, false, false, true);
    this.ct_addUnreadUntilHereButton(button, comment);
  }

  ct_addReadCommentButton(button, comment) {
    if (!button) {
      button = shared.common.createElements(comment.actions, 'beforeEnd', [{
        attributes: {
          class: 'esgst-ct-comment-button'
        },
        type: 'div'
      }]);
    }
    shared.common.createElements(button, 'inner', [{
      attributes: {
        class: 'fa fa-eye',
        title: shared.common.getFeatureTooltip('ct', 'Mark this comment as read')
      },
      type: 'i'
    }, {
      attributes: {
        title: shared.common.getFeatureTooltip('ct', 'Mark this comment as read and go to the next unread comment')
      },
      type: 'span',
      children: [{
        attributes: {
          class: 'fa fa-eye'
        },
        type: 'i'
      }, {
        attributes: {
          class: 'fa fa-angle-double-right'
        },
        type: 'i'
      }]
    }]);
    button.firstElementChild.addEventListener('click', this.ct_readComment.bind(this, button, comment));
    button.lastElementChild.addEventListener('click', this.ct_readCommentAndGo.bind(this, button, comment));
  }

  async ct_readComment(button, comment) {
    shared.common.createElements(button, 'inner', [{
      attributes: {
        class: 'fa fa-circle-o-notch fa-spin'
      },
      type: 'i'
    }]);
    await this.ct_markCommentRead(comment, null, true);
    button.innerHTML = '';
    this.ct_addUnreadCommentButton(button, comment);
  }

  async ct_readCommentAndGo(button, comment) {
    shared.common.createElements(button, 'inner', [{
      attributes: {
        class: 'fa fa-circle-o-notch fa-spin'
      },
      type: 'i'
    }]);
    await this.ct_markCommentRead(comment, null, true);
    button.innerHTML = '';
    this.ct_addUnreadCommentButton(button, comment);
    // noinspection JSIgnoredPromiseFromCall
    this.ct_getComments(0, this.esgst.scopes.main.comments, null, true);
  }

  ct_addUnreadCommentButton(button, comment) {
    if (!button) {
      button = shared.common.createElements(comment.actions, 'beforeEnd', [{
        attributes: {
          class: 'esgst-ct-comment-button'
        },
        type: 'div'
      }]);
    }
    shared.common.createElements(button, 'inner', [{
      attributes: {
        class: 'fa fa-eye-slash',
        title: `${shared.common.getFeatureTooltip('ct', 'Mark comment as unread')}`
      },
      type: 'i'
    }]);
    button.firstElementChild.addEventListener('click', this.ct_unreadComment.bind(this, button, comment));
  }

  async ct_unreadComment(button, comment) {
    shared.common.createElements(button, 'inner', [{
      attributes: {
        class: 'fa fa-circle-o-notch fa-spin'
      },
      type: 'i'
    }]);
    await this.ct_markCommentUnread(comment, null, true);
    button.innerHTML = '';
    this.ct_addReadCommentButton(button, comment);
  }

  ct_addCommentPanel(goToUnread, markRead, markUnread) {
    let button, key, newButton, url;
    goToUnread.addEventListener('click', this.ct_goToUnread.bind(this, goToUnread));
    markRead.addEventListener('click', this.ct_markCommentsRead.bind(this, markRead));
    markUnread.addEventListener('click', this.ct_markCommentsUnread.bind(this, markUnread));
    if (gSettings.ct_a && shared.common.isCurrentPath('Messages')) {
      button = document.querySelector(`.js__submit-form, .js_mark_as_read`);
      if (button) {
        if (this.esgst.sg) {
          newButton = shared.common.createElements(button, 'afterEnd', [{
            attributes: {
              class: 'sidebar__action-button'
            },
            type: 'div',
            children: [{
              attributes: {
                class: 'fa fa-check-circle'
              },
              type: 'i'
            }, {
              text: ' Mark as Read',
              type: 'node'
            }]
          }]);
          key = 'read_messages';
          url = '/messages';
        } else {
          newButton = shared.common.createElements(button, 'afterEnd', [{
            attributes: {
              class: 'page_heading_btn green'
            },
            type: 'a',
            children: [{
              attributes: {
                class: 'fa fa-check-square-o'
              },
              type: 'i'
            }, {
              text: 'Mark as Read',
              type: 'span'
            }]
          }]);
          key = 'mark_as_read';
          url = '/ajax.php';
        }
        button.remove();
        newButton.addEventListener('click', this.ct_markMessagesRead.bind(this, key, markRead, url));
      }
    }
  }

  async ct_markMessagesRead(key, markRead, url, event) {
    await shared.common.request({ data: `xsrf_token=${this.esgst.xsrfToken}&do=${key}`, method: 'POST', url });
    await this.ct_markCommentsRead(markRead);
    this.ct_completeInboxRead(event.currentTarget);
  }

  ct_completeInboxRead(newButton) {
    let elements, i, n;
    elements = document.querySelectorAll(`.comment__envelope, .comment_unread`);
    for (i = 0, n = elements.length; i < n; ++i) {
      elements[i].remove();
    }
    newButton.remove();
  }

  async ct_goToUnread(goToUnread) {
    shared.common.createElements(goToUnread, 'inner', [{
      attributes: {
        class: 'fa fa-circle-o-notch fa-spin'
      },
      type: 'i'
    }]);
    const found = await this.ct_getComments(0, this.esgst.scopes.main.comments, null, true, false, false);
    shared.common.createElements(goToUnread, 'inner', [{
      attributes: {
        class: 'fa fa-comments-o'
      },
      type: 'i'
    }]);
    if (!found) {
      shared.common.createAlert('No unread comments were found.');
    }
  }

  async ct_markCommentsRead(markRead) {
    shared.common.createElements(markRead, 'inner', [{
      attributes: {
        class: 'fa fa-circle-o-notch fa-spin'
      },
      type: 'i'
    }]);
    await this.ct_getComments(0, this.esgst.scopes.main.comments, null, false, true, false);
    shared.common.createElements(markRead, 'inner', [{
      attributes: {
        class: 'fa fa-eye'
      },
      type: 'i'
    }]);
  }

  async ct_markCommentsUnread(markUnread) {
    shared.common.createElements(markUnread, 'inner', [{
      attributes: {
        class: 'fa fa-circle-o-notch fa-spin'
      },
      type: 'i'
    }]);
    await this.ct_getComments(0, this.esgst.scopes.main.comments, null, false, false, true);
    shared.common.createElements(markUnread, 'inner', [{
      attributes: {
        class: 'fa fa-eye-slash'
      },
      type: 'i'
    }]);
  }

  ct_addDiscussionPanel(code, comments, container, context, count, diff, url, type, discussion, name) {
    const obj = {
      code,
      count,
      diff,
      panel: shared.common.createElements(context, this.esgst.giveawaysPath && !gSettings.oadd ? 'afterEnd' : 'beforeEnd', [{
        type: 'span',
        children: [{
          attributes: {
            class: 'esgst-ct-count esgst-hidden',
            title: shared.common.getFeatureTooltip('ct')
          },
          text: `(+${diff})`,
          type: 'span'
        }, {
          attributes: {
            class: 'esgst-heading-button esgst-hidden',
            title: shared.common.getFeatureTooltip('ct', 'Go to first unread comment of this discussion')
          },
          type: 'div',
          children: [{
            attributes: {
              class: 'fa fa-comments-o'
            },
            type: 'i'
          }]
        }, {
          attributes: {
            class: 'esgst-heading-button esgst-hidden',
            title: shared.common.getFeatureTooltip('ct', 'Mark all comments in this discussion as read')
          },
          type: 'div',
          children: [{
            attributes: {
              class: 'fa fa-eye'
            },
            type: 'i'
          }]
        }, {
          attributes: {
            class: 'esgst-heading-button esgst-hidden',
            title: shared.common.getFeatureTooltip('ct', 'Mark all comments in this discussion as unread')
          },
          type: 'div',
          children: [{
            attributes: {
              class: 'fa fa-eye-slash'
            },
            type: 'i'
          }]
        }, {
          attributes: {
            class: 'esgst-heading-button esgst-hidden',
            title: shared.common.getFeatureTooltip('ct', `Clean discussion (remove deleted comments from the database)`)
          },
          type: 'div',
          children: [{
            attributes: {
              class: 'fa fa-paint-brush'
            },
            type: 'i'
          }]
        }, {
          attributes: {
            class: 'fa fa-circle-o-notch fa-spin esgst-hidden'
          },
          type: 'i'
        }]
      }]),
      url
    };
    obj.diffContainer = obj.panel.firstElementChild;
    obj.goToUnread = obj.diffContainer.nextElementSibling;
    obj.markRead = obj.goToUnread.nextElementSibling;
    obj.markUnread = obj.markRead.nextElementSibling;
    obj.clean = obj.markUnread.nextElementSibling;
    obj.loadingIcon = obj.clean.nextElementSibling;
    if (gSettings.gdttt) {
      const button = new Button(obj.panel, 'beforeEnd', {
        callbacks: [this.esgst.modules.generalGiveawayDiscussionTicketTradeTracker.gdttt_markVisited.bind(this.esgst.modules.generalGiveawayDiscussionTicketTradeTracker, code, container, count, obj.diffContainer, type), null, this.esgst.modules.generalGiveawayDiscussionTicketTradeTracker.gdttt_markUnvisited.bind(this.esgst.modules.generalGiveawayDiscussionTicketTradeTracker, code, container, count, obj.diffContainer, type), null],
        className: 'esgst-gdttt-button',
        icons: ['fa-check esgst-clickable', 'fa-circle-o-notch fa-spin', 'fa-times esgst-clickable', 'fa-circle-o-notch fa-spin'],
        id: 'gdttt',
        index: !comments[code] || !comments[code].visited ? 0 : 2,
        titles: ['Mark discussion as visited', 'Marking...', 'Mark discussion as unvisited', 'Marking...']
      });
      if (discussion) {
        discussion.gdtttButton = button;
        discussion.count = count;
      }
    }
    if (gSettings.tds) {
      new Button(obj.panel, 'beforeEnd', {
        callbacks: [shared.esgst.modules.generalThreadSubscription.subscribe.bind(shared.esgst.modules.generalThreadSubscription, code, count, name, type), null, shared.esgst.modules.generalThreadSubscription.unsubscribe.bind(shared.esgst.modules.generalThreadSubscription, code, type), null],
        className: 'esgst-tds-button',
        icons: ['fa-bell-o esgst-clickable', 'fa-circle-o-notch fa-spin', 'fa-bell esgst-clickable', 'fa-circle-o-notch fa-spin'],
        id: 'tds',
        index: !comments[code] || typeof comments[code].subscribed === 'undefined' ? 0 : 2,
        titles: ['Subscribe', 'Subscribing...', 'Unsubscribe', 'Unsubscribing...']
      });
    }
    if (gSettings.ct && (this.esgst.giveawaysPath || this.esgst.discussionsPath)) {
      if (gSettings.ct_s) {
        if (diff > 0) {
          obj.diffContainer.classList.remove('esgst-hidden');
        }
      } else {
        if (diff > 0) {
          obj.diffContainer.classList.remove('esgst-hidden');
          obj.goToUnread.classList.remove('esgst-hidden');
          obj.markRead.classList.remove('esgst-hidden');
          if (diff !== count) {
            obj.markUnread.classList.remove('esgst-hidden');
          }
        } else {
          obj.markUnread.classList.remove('esgst-hidden');
        }
        obj.clean.classList.remove('esgst-hidden');
      }
    }
    obj.goToUnread.addEventListener('mousedown', this.ct_goToUnreadPanel.bind(this, obj));
    obj.markRead.addEventListener('click', this.ct_markReadPanel.bind(this, obj));
    obj.markUnread.addEventListener('click', this.ct_markUnreadPanel.bind(this, obj));
    obj.clean.addEventListener('click', this.ct_clean.bind(this, obj));
  }

  async ct_clean(obj) {
    obj.clean.classList.add('esgst-hidden');
    obj.goToUnread.classList.add('esgst-hidden');
    obj.markRead.classList.add('esgst-hidden');
    obj.markUnread.classList.add('esgst-hidden');
    obj.loadingIcon.classList.remove('esgst-hidden');
    await this.ct_markCommentsReadUnread(false, false, false, obj.code, `${obj.url}/search?page=`);
    obj.loadingIcon.classList.add('esgst-hidden');
    obj.goToUnread.classList.remove('esgst-hidden');
    obj.markRead.classList.remove('esgst-hidden');
    obj.clean.classList.remove('esgst-hidden');
    if (obj.diff !== obj.count) {
      obj.markUnread.classList.remove('esgst-hidden');
    }
  }

  async ct_goToUnreadPanel(obj, event) {
    this.ctNewTab = false;
    if (event.button === 1) {
      event.preventDefault();
      this.ctNewTab = true;
    } else if (event.button === 2) {
      return;
    }
    obj.clean.classList.add('esgst-hidden');
    obj.goToUnread.classList.add('esgst-hidden');
    obj.markRead.classList.add('esgst-hidden');
    obj.markUnread.classList.add('esgst-hidden');
    obj.loadingIcon.classList.remove('esgst-hidden');
    this.ctUnreadFound = false;
    await this.ct_markCommentsReadUnread(true, false, false, null, `${obj.url}/search?page=`);
    obj.loadingIcon.classList.add('esgst-hidden');
    obj.goToUnread.classList.remove('esgst-hidden');
    obj.markRead.classList.remove('esgst-hidden');
    obj.clean.classList.remove('esgst-hidden');
    if (obj.diff !== obj.count) {
      obj.markUnread.classList.remove('esgst-hidden');
    }
  }

  async ct_markReadPanel(obj) {
    obj.clean.classList.add('esgst-hidden');
    obj.goToUnread.classList.add('esgst-hidden');
    obj.markRead.classList.add('esgst-hidden');
    obj.markUnread.classList.add('esgst-hidden');
    obj.loadingIcon.classList.remove('esgst-hidden');
    await this.ct_markCommentsReadUnread(false, true, false, null, `${obj.url}/search?page=`);
    obj.loadingIcon.classList.add('esgst-hidden');
    obj.diffContainer.classList.add('esgst-hidden');
    obj.markUnread.classList.remove('esgst-hidden');
    obj.clean.classList.remove('esgst-hidden');
  }

  async ct_markUnreadPanel(obj) {
    obj.clean.classList.add('esgst-hidden');
    obj.goToUnread.classList.add('esgst-hidden');
    obj.markRead.classList.add('esgst-hidden');
    obj.markUnread.classList.add('esgst-hidden');
    obj.loadingIcon.classList.remove('esgst-hidden');
    const deleteLock = await shared.common.createLock('commentLock', 300);
    const comments = JSON.parse(shared.common.getValue('discussions'));
    for (const key in comments[obj.code].readComments) {
      if (comments[obj.code].readComments.hasOwnProperty(key)) {
        delete comments[obj.code].readComments[key];
      }
    }
    comments[obj.code].lastUsed = Date.now();
    await shared.common.setValue('discussions', JSON.stringify(comments));
    deleteLock();
    obj.loadingIcon.classList.add('esgst-hidden');
    obj.diffContainer.classList.remove('esgst-hidden');
    obj.diffContainer.textContent = `(+${obj.count})`;
    obj.goToUnread.classList.remove('esgst-hidden');
    obj.markRead.classList.remove('esgst-hidden');
    obj.clean.classList.remove('esgst-hidden');
  }

  async ct_markCommentsReadUnread(goToUnread, markRead, markUnread, code, url) {
    let firstRun = true;
    let lastPageMissing = false;
    let nextPage = 1;
    let comments = [];
    let discussion = null;
    if (code) {
      discussion = JSON.parse(shared.common.getValue('discussions'))[code];
      if (!discussion || !discussion.readComments) {
        return;
      }
    }
    while (true) {
      const context = utils.parseHtml((await shared.common.request({
        method: 'GET',
        queue: true,
        url: `${url}${nextPage}`
      })).responseText);
      if (code) {
        const elements = context.querySelectorAll(`[href*="/go/comment/"]`);
        // @ts-ignore
        for (const element of elements) {
          comments.push(element.getAttribute('href').match(/\/go\/comment\/(.+)/)[1]);
        }
      } else {
        await this.ct_getComments(0, await this.esgst.modules.comments.comments_get(context, context, true), null, goToUnread, markRead, markUnread);
      }

      if (goToUnread && this.ctUnreadFound) break;

      nextPage += 1;
      const pagination = context.getElementsByClassName('pagination__navigation')[0];

      if (!pagination || ((!goToUnread || ((!gSettings.ct_r || nextPage <= 1) && (gSettings.ct_r || pagination.lastElementChild.classList.contains('is-selected')))) && (goToUnread || pagination.lastElementChild.classList.contains('is-selected')))) break;

      if (!goToUnread || !gSettings.ct_r) continue;

      if (firstRun) {
        firstRun = !firstRun;
        const lastLink = pagination.lastElementChild;
        if (lastLink.textContent.match(/Last/)) {
          nextPage = parseInt(lastLink.getAttribute('data-page-number'));
        } else {
          nextPage = 999999999;
          lastPageMissing = true;
        }
      } else {
        if (lastPageMissing) {
          nextPage = parseInt(pagination.lastElementChild.getAttribute('data-page-number')) - 1;
        } else {
          nextPage -= 2;
        }
      }

      if (nextPage <= 1) break;
    }
    if (code) {
      for (const id in discussion.readComments) {
        if (discussion.readComments.hasOwnProperty(id) && id && comments.indexOf(id) < 0) {
          delete discussion.readComments[id];
        }
      }
      await shared.common.lockAndSaveDiscussions({ [code]: discussion });
    }
  }
}

const commentsCommentTracker = new CommentsCommentTracker();

export { commentsCommentTracker };