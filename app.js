/* Page rendering. Edit text, sections, links, and photographs in content.js. */
(() => {
  'use strict';
  const data = window.PORTFOLIO;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const make = (tag, cls = '', text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const currentPage = document.body.dataset.page;
  $$('[data-name]').forEach(n => { n.textContent = data.profile.name; });
  $$('[data-email]').forEach(n => { n.href = `mailto:${data.profile.email}`; });
  $$('[data-linkedin]').forEach(n => { n.href = data.profile.linkedin; });
  $$('[data-resume]').forEach(n => { n.href = data.profile.resume; });
  $$('[data-page-link]').forEach(n => { if (n.dataset.pageLink === (currentPage === 'project' ? 'projects' : currentPage)) n.setAttribute('aria-current','page'); });

  // Galleries share a viewer; each gallery keeps its own photo sequence.
  const dialog = $('#photo-dialog'), experienceDialog = $('#experience-dialog');
  let viewerPhotos = [], photoIndex = 0, opener = null, experienceOpener = null;
  function syncScrollLock() { document.body.style.overflow = dialog.open || experienceDialog?.open ? 'hidden' : ''; }
  function showPhoto(index, photos = viewerPhotos) {
    const p = photos[index]; if (!p) return;
    viewerPhotos = photos;
    photoIndex = index; $('#photo-title').textContent = p.caption || p.alt || 'Photo';
    $('#full-photo').src = p.src; $('#full-photo').alt = p.alt || p.caption || '';
    $('#photo-count').textContent = `${index + 1} / ${viewerPhotos.length}`;
    $('#previous-photo').disabled = index === 0; $('#next-photo').disabled = index === viewerPhotos.length - 1;
    $('#photo-navigation').hidden = viewerPhotos.length < 2;
    if (!dialog.open) { opener = document.activeElement; dialog.showModal(); }
    syncScrollLock();
    $('#close-photo').focus({preventScroll:true});
  }
  $('#close-photo').addEventListener('click',() => dialog.close());
  $('#previous-photo').addEventListener('click',() => showPhoto(photoIndex-1));
  $('#next-photo').addEventListener('click',() => showPhoto(photoIndex+1));
  dialog.addEventListener('close',() => { syncScrollLock(); const parent = opener?.closest('dialog'); if(opener?.isConnected && (!parent || parent.open)) opener.focus({preventScroll:true}); });
  dialog.addEventListener('keydown',event => { if(event.key === 'ArrowLeft' && photoIndex > 0) { event.preventDefault(); showPhoto(photoIndex-1); } if(event.key === 'ArrowRight' && photoIndex < viewerPhotos.length-1) { event.preventDefault(); showPhoto(photoIndex+1); } });
  dialog.addEventListener('click',event => { if(event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); });

  function addPhotos(photos,parent,cls = 'photo-grid work-photos') {
    if(!photos?.length) return;
    const grid = make('div',cls);
    photos.forEach((p,index) => {
      const figure = make('figure',`photo-tile${p.wide ? ' photo-wide' : ''}`), button = make('button','photo-button'), img = make('img');
      button.setAttribute('aria-label',`Enlarge ${p.caption || p.alt || `photo ${index+1}`}`);
      img.src = p.src; img.alt = p.alt || p.caption || ''; img.loading = 'lazy';
      img.addEventListener('error',() => { img.hidden = true; button.disabled = true; button.append(make('p','photo-error','Photo unavailable.')); },{once:true});
      button.append(img); button.addEventListener('click',() => showPhoto(index,photos)); figure.append(button);
      if(p.caption) figure.append(make('figcaption','',p.caption)); grid.append(figure);
    }); parent.append(grid);
  }
  function addTags(tags,parent) { if(!tags?.length) return; const ul = make('ul','tag-list'); tags.forEach(t => ul.append(make('li','',t))); parent.append(ul); }
  function addBullets(items,parent) { if(!items?.length) return; const ul = make('ul','entry-highlights'); items.forEach(t => ul.append(make('li','',t))); parent.append(ul); }
  function addLinks(links,parent) { if(!links?.length) return; const group = make('div','entry-links'); links.forEach(link => { const a = make('a','',link.label); a.href = link.href; if(/^https?:/.test(link.href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } group.append(a); }); parent.append(group); }

  function addVideos(videos, parent) {
  if (!videos?.length) return;

  videos.forEach(video => {
    const figure = make('figure', 'project-video');
    const player = make('video');

    player.controls = true;
    player.playsInline = true;
    player.preload = 'metadata';
    player.src = video.src;

    if (video.poster) player.poster = video.poster;

    figure.append(player);

    if (video.caption) {
      figure.append(make('figcaption', '', video.caption));
    }

    parent.append(figure);
  });
}
  function addTable(table,parent) {
    if(!table?.headers?.length || !table?.rows?.length) return;
    const wrap = make('div','table-wrap'), t = make('table','project-table'), head = make('thead'), row = make('tr');
    if(table.caption) t.append(make('caption','',table.caption));
    table.headers.forEach(h => { const th = make('th','',h); th.scope = 'col'; row.append(th); }); head.append(row); t.append(head);
    const body = make('tbody'); table.rows.forEach(cells => { const tr = make('tr'); cells.forEach(text => tr.append(make('td','',String(text)))); body.append(tr); });
    t.append(body); wrap.append(t); parent.append(wrap);
  }

  function openExperience(item, trigger) {
    if (!experienceDialog) return;
    const panel = item.panel || {};
    const target = $('#experience-body');
    $('#experience-heading').textContent = panel.heading || item.title;
    const subheading = $('#experience-subheading');
    subheading.textContent = panel.subheading ?? item.organization;
    subheading.hidden = !subheading.textContent;
    if (subheading.hidden) experienceDialog.removeAttribute('aria-describedby');
    else experienceDialog.setAttribute('aria-describedby','experience-subheading');
    $('#experience-date').textContent = item.date;
    $('#experience-status').textContent = item.status || '';
    $('#experience-status').hidden = !item.status;
    target.replaceChildren();
    (panel.paragraphs ?? [item.description]).forEach(text => target.append(make('p','panel-paragraph',text)));
    if (panel.highlights?.length && panel.highlightsHeading) target.append(make('h3','panel-section-heading',panel.highlightsHeading));
    addBullets(panel.highlights,target);
    addTags(panel.tags,target);
    addLinks(panel.links,target);
    addPhotos(panel.photos,target,'photo-grid work-photos panel-photos');
    
    experienceOpener = trigger;
    if (!experienceDialog.open) experienceDialog.showModal();
    experienceDialog.scrollTop = 0;
    syncScrollLock();
    $('#close-experience').focus({preventScroll:true});
  }

  if(currentPage === 'home') {
    $('#close-experience').addEventListener('click',() => experienceDialog.close());
    experienceDialog.addEventListener('close',() => {
      if (dialog.open) dialog.close();
      syncScrollLock();
      if (experienceOpener?.isConnected) experienceOpener.focus({preventScroll:true});
    });
    experienceDialog.addEventListener('click',event => {
      if (event.target !== experienceDialog) return;
      const r = experienceDialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) experienceDialog.close();
    });
    $('#introduction').textContent = data.profile.introduction; $('#about-description').textContent = data.profile.about; $('#portrait').src = data.profile.portrait;
    $('#availability-label').textContent = data.profile.availability; $('#availability-dates').textContent = data.profile.availabilityDates;
    data.profile.skills.forEach(s => $('#skill-list').append(make('li','',s)));
    data.timeline.forEach(item => {
      const li = make('li',`timeline-item${item.future ? ' future' : ''}`); li.id = item.id;
      const copy = make('div','timeline-copy'), titles = make('div','timeline-title-row'); titles.append(make('h3','',item.title));
      if(item.status !== 'Completed') titles.append(make('span','status',item.status));
      copy.append(titles,make('p','timeline-organization',item.organization),make('p','timeline-description',item.description));
      const detailsButton = make('button','timeline-panel-button',item.panel?.buttonLabel || 'View details');
      detailsButton.type = 'button';
      detailsButton.setAttribute('aria-haspopup','dialog');
      detailsButton.setAttribute('aria-controls','experience-dialog');
      detailsButton.setAttribute('aria-label',`${item.panel?.buttonLabel || 'View details'}: ${item.title}`);
      detailsButton.addEventListener('click',() => openExperience(item,detailsButton));
      copy.append(detailsButton);
      li.append(make('p','timeline-date',item.date),copy); $('#timeline').append(li);
    });
  }
  if(currentPage === 'projects' || currentPage === 'publications') {
    const items = data[currentPage], target = $('#entries');
    if(!items.length) target.append(make('p','empty-state',`No ${currentPage} listed.`));
    items.forEach(item => {
      const article = make('article',`work-entry${currentPage === 'publications' ? ' publication-entry' : ''}`); article.id = item.id;
      const meta = make('div','work-meta'); meta.append(make('p','eyebrow',item.category)); if(item.status) meta.append(make('span','status',item.status));
      const main = make('div','work-main'), h = make('h2'), a = make('a','',item.title);
      a.href = currentPage === 'projects' ? `project.html?id=${encodeURIComponent(item.id)}` : `#${item.id}`; h.append(a);
      main.append(h,make('p','work-organization',item.organization),make('p','work-description',item.summary || item.description)); addTags(item.tags,main);
      if(currentPage === 'projects') { const link = make('a','project-link','View project'); link.href = a.href; main.append(link); }
      else { addPhotos(item.photos,main); addLinks(item.links,main); }
      article.append(meta,main); target.append(article);
    });
  }
  if(currentPage === 'project') {
    const id = new URLSearchParams(location.search).get('id'), item = data.projects.find(p => p.id === id);
    if(!item) { $('#project-title').textContent = 'Project not found'; $('#project-description').textContent = 'This project may have moved. Return to the projects page to view the available projects.'; $('#project-layout').hidden = true; }
    else {
      document.title = `${item.title} · ${data.profile.name}`;
      $('meta[name="description"]').content = item.summary || item.description;
      $('#project-title').textContent = item.title; $('#breadcrumb-title').textContent = item.title;
      $('#project-category').textContent = item.category; $('#project-description').textContent = item.description;
      const sidebar = $('#project-sidebar'), target = $('#project-content'), contents = make('ul');
      sidebar.append(make('h2','','On this page'),contents);
      if(item.status) sidebar.append(make('span','status',item.status));
      const sections = [
  {
    id: 'overview',
    title: 'Overview',
    paragraphs: [item.organization],
    bullets: item.highlights || [],
    tags: item.tags,
    links: item.teammates
  },
  ...(item.sections || [])
];
      if(item.photos?.length) sections.push({id:'photos',title:'Photos',photos:item.photos});
      if(item.links?.length) sections.push({id:'links',title:'Links & files',links:item.links});
      const used = new Set();
      sections.forEach((section,index) => {
        const base = section.id || `section-${index+1}`; let sid = base; while(used.has(sid)) sid += '-more'; used.add(sid);
        const block = make('section','project-section'); block.id = sid; block.append(make('h2','',section.title));
        (section.paragraphs || []).forEach(text => block.append(make('p','',text)));
        (section.bullets,block); addBullets(section.bullets, block);
addTable(section.table, block);
addTags(section.tags, block);
addPhotos(section.photos, block);
addVideos(section.videos, block);
addLinks(section.links, block);
target.append(block);
        const li = make('li'), a = make('a','',section.title); a.href = `#${sid}`; li.append(a); contents.append(li);
      });
    }
  }
  if(currentPage === 'photos') { if(data.photos.length) addPhotos(data.photos,$('#photo-gallery'),'photo-grid'); else $('#photo-gallery').append(make('p','empty-state','No photos added yet.')); }
  if(location.hash) { try { const target = document.getElementById(decodeURIComponent(location.hash.slice(1))); if(target) requestAnimationFrame(() => target.scrollIntoView()); } catch { /* Invalid URL fragment. */ } }
})();
