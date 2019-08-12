import { Module } from '../../class/Module';
import { common } from '../Common';
import { gSettings } from '../../class/Globals';

const
  createElements = common.createElements.bind(common),
  getFeatureTooltip = common.getFeatureTooltip.bind(common)
  ;

class GiveawaysSteamActivationLinks extends Module {
  constructor() {
    super();
    this.info = {
      description: [
        [`ul`, [
          [`li`, [
            `Adds 2 optional icons (`,
            [`i`, { class: `fa fa-steam` }],
            ` for the Steam client and `,
            [`i`, { class: `fa fa-globe` }],
            ` for the browser) next to each key in the "Key" column of your `,
            [`a`, { href: `https://www.steamgifts.com/giveaways/won` }, `won`],
            ` page that allow you to quickly activate a won game on Steam, either through the client or the browser.`
          ]],
          [`li`, `When you click on the icon, the key is automatically copied to the clipboard.`]
        ]]
      ],
      id: `sal`,
      name: `Steam Activation Links`,
      options: {
        title: `Show links to:`,
        values: [`Steam Client`, `Browser`, `Both`]
      },
      sg: true,
      type: `giveaways`
    };
  }

  init() {
    if (!this.esgst.wonPath) return;
    this.esgst.endlessFeatures.push(this.sal_addLinks.bind(this), this.sal_addObservers.bind(this));
  }

  sal_addObservers(context, main, source, endless) {
    const elements = context.querySelectorAll(`${endless ? `.esgst-es-page-${endless} .view_key_btn, .esgst-es-page-${endless}.view_key_btn` : `.view_key_btn`}`);
    for (const element of elements) {
      this.sal_addObserver(element);
    }
  }

  sal_addObserver(button) {
    let interval = null;
    const context = button.closest(`.table__row-outer-wrap`);
    button.addEventListener(`click`, () => {
      if (interval) {
        return;
      }
      interval = window.setInterval(() => {
        if (!context.contains(button)) {
          window.clearInterval(interval);
          interval = null;
          if (gSettings.sal) {
            const element = context.querySelector(`[data-clipboard-text]`);
            const match = element.getAttribute(`data-clipboard-text`).match(/^[\d\w]{5}(-[\d\w]{5}){2,}$/);
            if (match) {
              this.sal_addLink(element, match[0]);
            }
          }
          if (gSettings.ef) {
            this.esgst.modules.generalElementFilters.ef_hideElements(context);
          }
        }
      }, 100);
    });
  }

  sal_addLinks(context, main, source, endless) {
    const elements = context.querySelectorAll(`${endless ? `.esgst-es-page-${endless} [data-clipboard-text], .esgst-es-page-${endless}[data-clipboard-text]` : `[data-clipboard-text]`}`);
    for (const element of elements) {
      if (element.parentElement.getElementsByClassName(`esgst-sal`)[0]) {
        continue;
      }
      const match = element.getAttribute(`data-clipboard-text`).match(/^[\d\w]{5}(-[\d\w]{5}){2,}$/);
      if (match) {
        this.sal_addLink(element, match[0]);
      }
    }
  }

  sal_addLink(element, match) {
    let link, textArea;
    if ((element.nextElementSibling && !element.nextElementSibling.classList.contains(`esgst-sal`)) || !element.nextElementSibling) {
      link = createElements(element, `afterEnd`, [{
        type: `span`
      }]);
      switch (gSettings.sal_index) {
        case 0:
          createElements(link, `beforeEnd`, [{
            attributes: {
              class: `esgst-sal esgst-clickable`,
              title: getFeatureTooltip(`sal`, `Activate on Steam (client)`)
            },
            type: `span`,
            children: [{
              attributes: {
                class: `fa fa-steam`
              },
              type: `i`
            }]
          }]).addEventListener(`click`, () => {
            textArea = createElements(document.body, `beforeEnd`, [{
              type: `textarea`
            }]);
            textArea.value = match;
            textArea.select();
            document.execCommand(`copy`);
            textArea.remove();
            window.location.href = `steam://open/activateproduct`;
          });
          break;
        case 1:
          createElements(link, `beforeEnd`, [{
            attributes: {
              class: `esgst-sal esgst-clickable`,
              href: `https://store.steampowered.com/account/registerkey?key=${match}`,
              target: `_blank`,
              title: getFeatureTooltip(`sal`, `Activate on Steam (browser)`)
            },
            type: `a`,
            children: [{
              attributes: {
                class: `fa fa-globe`
              },
              type: `i`
            }]
          }]);
          break;
        case 2:
          createElements(link, `beforeEnd`, [{
            attributes: {
              class: `esgst-sal esgst-clickable`,
              title: getFeatureTooltip(`sal`, `Activate on Steam (client)`)
            },
            type: `span`,
            children: [{
              attributes: {
                class: `fa fa-steam`
              },
              type: `i`
            }]
          }, {
            attributes: {
              class: `esgst-sal esgst-clickable`,
              href: `https://store.steampowered.com/account/registerkey?key=${match}`,
              target: `_blank`,
              title: getFeatureTooltip(`sal`, `Activate on Steam (browser)`)
            },
            type: `a`,
            children: [{
              attributes: {
                class: `fa fa-globe`
              },
              type: `i`
            }]
          }]).previousElementSibling.addEventListener(`click`, () => {
            textArea = createElements(document.body, `beforeEnd`, [{
              type: `textarea`
            }]);
            textArea.value = match;
            textArea.select();
            document.execCommand(`copy`);
            textArea.remove();
            window.location.href = `steam://open/activateproduct`;
          });
          break;
      }
    }
  }
}

const giveawaysSteamActivationLinks = new GiveawaysSteamActivationLinks();

export { giveawaysSteamActivationLinks };