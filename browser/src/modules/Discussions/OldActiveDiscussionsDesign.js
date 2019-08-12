import { Module } from '../../class/Module';
import { utils } from '../../lib/jsUtils';
import { common } from '../Common';
import { gSettings } from '../../class/Globals';

const
  parseHtml = utils.parseHtml.bind(utils),
  createElements = common.createElements.bind(common),
  endless_load = common.endless_load.bind(common),
  request = common.request.bind(common)
  ;

class DiscussionsOldActiveDiscussionsDesign extends Module {
  constructor() {
    super();
    this.info = {
      description: [
        [`ul`, [
          [`li`, `Brings back the SteamGifts' old active discussions design, while keeping the new "Deals" section.`],
          [`li`, [
            `Only one section ("Discussions" or "Deals") can be shown at a time. There is a button (`,
            [`i`, { class: `fa fa-retweet` }],
            `) in the page heading of the active discussions that allows you to switch sections.`
          ]]
        ]]
      ],
      features: {
        oadd_d: {
          description: [
            [`ul`, [
              [`li`, `With this option enabled, the deals are included in the "Discussions" section instead of being exclusive to the "Deals" section.`]
            ]]
          ],
          name: `Show deals in the "Discussions" section.`,
          sg: true
        }
      },
      id: `oadd`,
      name: `Old Active Discussions Design`,
      sg: true,
      type: `discussions`
    };
  }

  async init() {
    if (!this.esgst.giveawaysPath || !this.esgst.activeDiscussions) return;
    await this.oadd_load();
  }

  async oadd_load(refresh, callback) {
    let deals, dealsRows, dealsSwitch, discussions, discussionsRows, discussionsSwitch, i, j, response1Html,
      response2Html, revisedElements;
    response1Html = parseHtml((await request({ method: `GET`, url: `/discussions` })).responseText);
    response2Html = parseHtml((await request({ method: `GET`, url: `/discussions/deals` })).responseText);
    this.esgst.activeDiscussions.classList.add(`esgst-oadd`);
    createElements(this.esgst.activeDiscussions, `inner`, [{
      type: `div`,
      children: [{
        attributes: {
          class: `page__heading`
        },
        type: `div`,
        children: [{
          attributes: {
            class: `esgst-heading-button`,
            title: `Switch to Deals`
          },
          type: `div`,
          children: [{
            attributes: {
              class: `fa fa-retweet`
            },
            type: `i`
          }]
        }, {
          attributes: {
            class: `page__heading__breadcrumbs`
          },
          type: `div`,
          children: [{
            attributes: {
              href: `/discussions`
            },
            text: `Active Discussions`,
            type: `a`
          }]
        }, {
          attributes: {
            class: `page__heading__button page__heading__button--green`,
            href: `/discussions`
          },
          type: `a`,
          children: [{
            text: `More`,
            type: `node`
          }, {
            attributes: {
              class: `fa fa-angle-right`
            },
            type: `i`
          }]
        }]
      }, {
        attributes: {
          class: `table`
        },
        type: `div`,
        children: [{
          attributes: {
            class: `table__heading`
          },
          type: `div`,
          children: [{
            attributes: {
              class: `table__column--width-fill`
            },
            text: `Summary`,
            type: `div`
          }, {
            attributes: {
              class: `table__column--width-small text-center`
            },
            text: `Comments`,
            type: `div`
          }, {
            attributes: {
              class: `table__column--width-medium text-right`
            },
            text: `Last Post`,
            type: `div`
          }]
        }, {
          attributes: {
            class: `table__rows`
          },
          type: `div`
        }]
      }]
    }, {
      attributes: {
        class: `esgst-hidden`
      },
      type: `div`,
      children: [{
        attributes: {
          class: `page__heading`
        },
        type: `div`,
        children: [{
          attributes: {
            class: `esgst-heading-button`,
            title: `Switch to Discussions`
          },
          type: `div`,
          children: [{
            attributes: {
              class: `fa fa-retweet`
            },
            type: `i`
          }]
        }, {
          attributes: {
            class: `page__heading__breadcrumbs`
          },
          type: `div`,
          children: [{
            attributes: {
              href: `/discussions/deals`
            },
            text: `Active Deals`,
            type: `a`
          }]
        }, {
          attributes: {
            class: `page__heading__button page__heading__button--green`,
            href: `/discussions/deals`
          },
          type: `a`,
          children: [{
            text: `More`,
            type: `node`
          }, {
            attributes: {
              class: `fa fa-angle-right`
            },
            type: `i`
          }]
        }]
      }, {
        attributes: {
          class: `table`
        },
        type: `div`,
        children: [{
          attributes: {
            class: `table__heading`
          },
          type: `div`,
          children: [{
            attributes: {
              class: `table__column--width-fill`
            },
            text: `Summary`,
            type: `div`
          }, {
            attributes: {
              class: `table__column--width-small text-center`
            },
            text: `Comments`,
            type: `div`
          }, {
            attributes: {
              class: `table__column--width-medium text-right`
            },
            text: `Last Post`,
            type: `div`
          }]
        }, {
          attributes: {
            class: `table__rows`
          },
          type: `div`
        }]
      }]
    }]);
    discussions = this.esgst.activeDiscussions.firstElementChild;
    deals = discussions.nextElementSibling;
    discussionsSwitch = discussions.firstElementChild.firstElementChild;
    discussionsRows = discussions.lastElementChild.lastElementChild;
    dealsSwitch = deals.firstElementChild.firstElementChild;
    dealsRows = deals.lastElementChild.lastElementChild;
    let preset = null;
    if (gSettings.df && gSettings.df_m && gSettings.df_enable) {
      let name = gSettings.df_preset;
      if (name) {
        let i;
        for (i = gSettings.df_presets.length - 1; i > -1 && gSettings.df_presets[i].name !== name; i--) {
        }
        if (i > -1) {
          preset = gSettings.df_presets[i];
        }
      }
    }
    let elements = await this.esgst.modules.discussions.discussions_get(response1Html, true);
    if (!gSettings.oadd_d) {
      revisedElements = [];
      elements.forEach(element => {
        // @ts-ignore
        if (element.category !== `Deals`) {
          revisedElements.push(element);
        }
      });
      elements = revisedElements;
    }
    const filters = this.esgst.modules.discussionsDiscussionFilters.getFilters();
    for (i = 0, j = elements.length - 1; i < 5 && j > -1; j--) {
      if (!preset || this.esgst.modules.discussionsDiscussionFilters.filters_filterItem(filters, elements[j], preset.rules)) {
        // @ts-ignore
        discussionsRows.appendChild(elements[j].outerWrap);
        i += 1;
      }
    }
    elements = await this.esgst.modules.discussions.discussions_get(response2Html, true);
    for (i = 0, j = elements.length - 1; i < 5 && j > -1; j--) {
      if (!preset || this.esgst.modules.discussionsDiscussionFilters.filters_filterItem(filters, elements[j], preset.rules)) {
        // @ts-ignore
        dealsRows.appendChild(elements[j].outerWrap);
        i += 1;
      }
    }
    discussionsSwitch.addEventListener(`click`, () => {
      discussions.classList.add(`esgst-hidden`);
      deals.classList.remove(`esgst-hidden`);
    });
    dealsSwitch.addEventListener(`click`, () => {
      discussions.classList.remove(`esgst-hidden`);
      deals.classList.add(`esgst-hidden`);
    });
    if (gSettings.adots) {
      this.esgst.modules.discussionsActiveDiscussionsOnTopSidebar.adots_load(refresh);
    } else if (gSettings.radb) {
      this.esgst.modules.discussionsRefreshActiveDiscussionsButton.radb_addButtons();
    }
    if (refresh) {
      await endless_load(this.esgst.activeDiscussions);
      if (callback) {
        callback();
      }
    } else if (callback) {
      callback();
    }
  }
}

const discussionsOldActiveDiscussionsDesign = new DiscussionsOldActiveDiscussionsDesign();

export { discussionsOldActiveDiscussionsDesign };