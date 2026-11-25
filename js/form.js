// The hold-dates form. system.js runs it: it checks the fields on submit, puts each reason under its
// own field, and sends by fetch only to data-endpoint, showing the sent line only once that answers.
// With no endpoint the browser sends the form its own way, which opens a written email to NotOnMap,
// and no success line is shown. Nothing here writes a confirmation of its own.

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const field = ({ id, label, type = 'text', autocomplete, inputmode, required = true, error, full = false, options, rows }) => {
  const describe = ` aria-describedby="${id}-err"`;
  const req = required ? ' required' : '';
  let control;
  if (options) {
    control = `<select id="${id}" name="${id}"${req}${describe}>`
      + options.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('')
      + '</select>';
  } else if (rows) {
    control = `<textarea id="${id}" name="${id}" rows="${rows}"${req}${describe}></textarea>`;
  } else {
    control = `<input id="${id}" name="${id}" type="${type}"`
      + (autocomplete ? ` autocomplete="${autocomplete}"` : '')
      + (inputmode ? ` inputmode="${inputmode}"` : '')
      + `${req}${describe}>`;
  }
  return `<div class="field${full ? ' field--full' : ''}">`
    + `<label for="${id}">${esc(label)}</label>${control}`
    + `<p class="field__error" id="${id}-err" hidden>${esc(error)}</p></div>`;
};

export function formHtml (data) {
  const { settings, partners, journeys } = data;
  const endpoint = (settings.formEndpoint || '').trim();
  const mail = settings.mailFallback;

  const fields = [
    field({ id: 'organisation', label: 'Organisation', autocomplete: 'organization', error: 'Write the name of your company or institution.' }),
    field({ id: 'name', label: 'Contact name', autocomplete: 'name', error: 'Write a name we can reply to.' }),
    field({ id: 'email', label: 'Email', type: 'email', autocomplete: 'email', inputmode: 'email', error: 'Add an email so we can reply.' }),
    field({ id: 'phone', label: 'Phone or WhatsApp', type: 'tel', autocomplete: 'tel', required: false, error: 'Write a number we can reach you on, or leave it empty.' }),
    field({
      id: 'partner',
      label: 'Partner type',
      error: 'Pick the kind of partner you are.',
      options: partners.partners.map((p) => ({ value: p.id, label: p.label }))
    }),
    field({ id: 'months', label: 'Months', error: 'Write which months you are asking about.' }),
    field({ id: 'guests', label: 'Group size', inputmode: 'numeric', error: 'Write how many guests, as a number.' }),
    field({
      id: 'journey',
      label: 'Base or journey',
      error: 'Pick the journey you want to sell.',
      options: [
        ...journeys.journeys.map((j) => ({ value: j.id, label: j.name })),
        { value: 'not-sure', label: 'Not sure yet' }
      ]
    }),
    field({ id: 'message', label: 'Message', rows: 2, required: false, full: true, error: 'Tell us anything else we should know.' })
  ].join('');

  return `<form class="form" action="mailto:${esc(mail)}" method="post" enctype="text/plain"`
    + ` data-endpoint="${esc(endpoint)}"`
    + ` data-sending="Sending"`
    + ` data-sent="Your hold-dates request is in. We reply ${esc(settings.replyTime)}."`
    + ` data-failed="Not sent: the connection failed. Your words are still here. Send them to us by email instead."`
    + ' novalidate>'
    + fields
    + '<p class="t-small field--full"><a class="link" href="visitor-code.html">Read the visitor code</a> before you send. Your details go to NotOnMap only, and we reply within a day.</p>'
    + '<div class="btn-row"><button class="btn btn--primary" type="submit">Hold dates</button></div>'
    + '<p class="form__status" role="status" data-form-status></p>'
    + '</form>';
}

/** Fills the form from the link that opened it: a partner view, or the planner's "Hold these dates". */
export function prefill (form, params) {
  const set = (name, value) => {
    if (!value) return;
    const el = form.elements[name];
    if (!el) return;
    if (el.tagName === 'SELECT' && ![...el.options].some((o) => o.value === value)) return;
    el.value = value;
  };
  set('partner', params.get('p'));
  set('journey', params.get('journey'));
  set('months', params.get('months'));
  set('guests', params.get('guests'));
  const summary = params.get('plan');
  if (summary && form.elements.message && !form.elements.message.value) {
    form.elements.message.value = summary;
  }
}

export function mountForm (slot, data, params) {
  slot.innerHTML = formHtml(data);
  const form = slot.querySelector('form');
  prefill(form, params);
  return form;
}
