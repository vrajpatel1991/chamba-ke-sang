// The ask-about-dates form. system.js runs it: it checks the fields on submit, puts each reason
// under its own field, and sends by fetch only to data-endpoint, showing the sent line only once
// that answers. With no endpoint the browser sends the form its own way, which opens a written
// email to NotOnMap, and no success line is shown. Nothing here writes a confirmation of its own.

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
  const mail = 'hello@notonmap.example';

  const fields = [
    field({ id: 'name', label: 'Your name', autocomplete: 'name', error: 'Write a name we can reply to.' }),
    field({ id: 'email', label: 'Email', type: 'email', autocomplete: 'email', inputmode: 'email', error: 'Add an email so we can reply.' }),
    field({
      id: 'trip',
      label: 'Which trip',
      error: 'Pick the version of the trip you want.',
      options: data.trips.map((t) => ({ value: t.id, label: t.label }))
    }),
    field({ id: 'people', label: 'How many of you', inputmode: 'numeric', error: 'Write how many people, as a number.' }),
    field({ id: 'months', label: 'Months that suit you', error: 'Write the months you are thinking of.' }),
    field({ id: 'message', label: 'Anything we should know', rows: 2, required: false, full: true, error: 'Tell us anything else we should know.' })
  ].join('');

  return `<form class="form" action="mailto:${esc(mail)}" method="post" enctype="text/plain"`
    + ' data-endpoint=""'
    + ' data-sending="Sending"'
    + ' data-sent="Your question is in. We reply within a day."'
    + ' data-failed="Not sent: the connection failed. Your words are still here. Send them to us by email instead."'
    + ' novalidate>'
    + fields
    + `<p class="t-small field--full">The trip runs ${esc(data.trip.seasons)}. Your details go to NotOnMap only.</p>`
    + '<div class="btn-row"><button class="btn btn--primary" type="submit">Ask about dates</button></div>'
    + '<p class="form__status" role="status" data-form-status></p>'
    + '<ul class="after field--full">'
    + '<li>We reply within a day.</li>'
    + '<li>Dates, the group size and the price are settled with you.</li>'
    + '<li>Your share of each cause is fixed before you book.</li></ul>'
    + '</form>';
}

/** Fills the form from the link that opened it, so a shared trip link arrives chosen. */
export function prefill (form, params) {
  const trip = params.get('trip');
  if (!trip || !form.elements.trip) return;
  if ([...form.elements.trip.options].some((o) => o.value === trip)) form.elements.trip.value = trip;
}

export function mountForm (slot, data, params) {
  slot.innerHTML = formHtml(data);
  const form = slot.querySelector('form');
  prefill(form, params);
  return form;
}
