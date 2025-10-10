console.log(JSON.stringify({
  root: {
    id: 'root',
    type: 'dock',
    padding: { x: '15px', y: '15px' },

    // Top toolbar
    topCenter: {
      id: 'toolbar',
      type: 'stack',
      direction: 'horizontal',
      size: { x: '80%', y: '50px' },
      align: 'center',
      gap: '10px',
      children: [
        {
          id: 'tool1',
          type: 'leaf',
          size: { x: '40px', y: '40px' },
        },
        {
          id: 'tool2',
          type: 'leaf',
          size: { x: '40px', y: '40px' },
        },
        {
          id: 'tool3',
          type: 'leaf',
          size: { x: '40px', y: '40px' },
        },
        {
          id: 'separator',
          type: 'leaf',
          size: { x: '2px', y: '30px' },
        },
        {
          id: 'tool4',
          type: 'leaf',
          size: { x: '40px', y: '40px' },
        },
      ],
    },

    // Left panel with tabs
    leftCenter: {
      id: 'left-panel',
      type: 'stack',
      direction: 'vertical',
      size: { x: '220px', y: '70%' },
      gap: '5px',
      children: [
        {
          id: 'tabs',
          type: 'stack',
          direction: 'horizontal',
          size: { y: '30px' },
          gap: '2px',
          children: [
            {
              id: 'tab1',
              type: 'leaf',
              size: { x: '70px' },
            },
            {
              id: 'tab2',
              type: 'leaf',
              size: { x: '70px' },
            },
            {
              id: 'tab3',
              type: 'leaf',
              size: { x: '70px' },
            },
          ],
        },
        {
          id: 'tab-content',
          type: 'leaf',
        },
      ],
    },

    // Main center area
    center: {
      id: 'main-area',
      type: 'dock',
      size: { x: '60%', y: '75%' },

      center: {
        id: 'viewport',
        type: 'leaf',
        size: { x: '80%', y: '80%' },
      },

      topRight: {
        id: 'hud',
        type: 'stack',
        direction: 'vertical',
        size: { x: '150px', y: '120px' },
        gap: '5px',
        children: [
          {
            id: 'health',
            type: 'leaf',
            size: { y: '25px' },
          },
          {
            id: 'mana',
            type: 'leaf',
            size: { y: '25px' },
          },
          {
            id: 'score',
            type: 'leaf',
            size: { y: '25px' },
          },
        ],
      },
    },

    // Right panel
    rightCenter: {
      id: 'properties',
      type: 'stack',
      direction: 'vertical',
      size: { x: '180px', y: '80%' },
      gap: '10px',
      children: [
        {
          id: 'properties-header',
          type: 'leaf',
          size: { y: '30px' },
        },
        {
          id: 'property-list',
          type: 'leaf',
        },
      ],
    },

    // Bottom panels
    bottomLeft: {
      id: 'chat',
      type: 'stack',
      direction: 'vertical',
      size: { x: '300px', y: '120px' },
      gap: '5px',
      children: [
        {
          id: 'chat-messages',
          type: 'leaf',
        },
        {
          id: 'chat-input',
          type: 'leaf',
          size: { y: '25px' },
        },
      ],
    },

    bottomRight: {
      id: 'debug-panel',
      type: 'leaf',
      size: { x: '200px', y: '100px' },
    },
  },
}, null, 2));
