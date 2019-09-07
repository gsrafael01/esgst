import { Module } from '../../class/Module';
import { common } from '../Common';
import { gSettings } from '../../class/Globals';

const
  animateScroll = common.animateScroll.bind(common),
  createElements = common.createElements.bind(common),
  createHeadingButton = common.createHeadingButton.bind(common),
  getFeatureTooltip = common.getFeatureTooltip.bind(common)
  ;

class GeneralScrollToTopButton extends Module {
  constructor() {
    super();
    this.info = {
      description: [
        ['ul', [
          ['li', [
            `Adds a button (`,
            ['i', { class: 'fa fa-chevron-up' }],
            `) either to the bottom right corner, the main page heading or the footer (you can decide where) of any page that takes you to the top of the page.`
          ]]
        ]]
      ],
      id: 'sttb',
      name: 'Scroll To Top Button',
      options: {
        title: `Show in:`,
        values: ['Bottom Right Corner', 'Main Page Heading', 'Footer']
      },
      sg: true,
      st: true,
      type: 'general'
    };
  }

  init() {
    let button;
    switch (gSettings.sttb_index) {
      case 0:
        button = createElements(document.body, 'beforeEnd', [{
          attributes: {
            class: 'esgst-sttb-button esgst-sttb-button-fixed',
            title: `${getFeatureTooltip('sttb', 'Scroll to top')}`
          },
          type: 'div',
          children: [{
            attributes: {
              class: 'fa fa-chevron-up'
            },
            type: 'i'
          }]
        }]);
        button.classList.add('esgst-hidden');
        window.addEventListener('scroll', () => {
          if (window.scrollY > 100) {
            button.classList.remove('esgst-hidden');
          } else {
            button.classList.add('esgst-hidden');
          }
        });
        break;
      case 1:
        button = createHeadingButton({ id: 'sttb', icons: ['fa-chevron-up'], title: 'Scroll to top' });
        button.classList.add('esgst-sttb-button');
        break;
      case 2:
        button = createElements(this.esgst.footer.firstElementChild.lastElementChild, 'beforeEnd', [{
          attributes: {
            class: 'esgst-sttb-button',
            title: getFeatureTooltip('sttb', 'Scroll to top')
          },
          type: this.esgst.sg ? 'div' : 'li',
          children: [{
            attributes: {
              class: 'fa fa-chevron-up'
            },
            type: 'i'
          }]
        }]);
        break;
    }
    button.addEventListener('click', animateScroll.bind(common, 0, () => {
      if (gSettings.es && this.esgst.es.paginations) {
        this.esgst.modules.generalEndlessScrolling.es_changePagination(this.esgst.es, this.esgst.es.reverseScrolling ? this.esgst.es.paginations.length : 1);
      }
    }));
  }
}

const generalScrollToTopButton = new GeneralScrollToTopButton();

export { generalScrollToTopButton };