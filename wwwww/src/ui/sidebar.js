// using context
$('.ui.sidebar')
  .sidebar({
    transition: 'overlay',
    dimPage: false,
    context: $('.bottom.admv-canvas')
  })
  .sidebar('attach events', '.organ-list-btn');
