window.datastore = {
  getProducts: function() {
    return this.products;
  },

  getProperties: function() {
    return this.properties;
  },

  getOperators: function() {
    return this.operators;
  },

  products: [
    {
      properties: [
        {
          name: 'Product Name',
          value: 'Headphones'
        },
        {
          name: 'color',
          value: 'black'
        },
        {
          name: 'weight (oz)',
          value: 5
        },
        {
          name: 'category',
          value: 'electronics'
        },
        {
          name: 'wireless',
          value: 'false'
        }
      ]
    },
    {
      properties: [
        {
          name: 'Product Name',
          value: 'Cell Phone'
        },
        {
          name: 'color',
          value: 'black'
        },
        {
          name: 'weight (oz)',
          value: 3
        },
        {
          name: 'category',
          value: 'electronics'
        },
        {
          name: 'wireless',
          value: 'true'
        }
      ]
    },
    {
      properties: [
        {
          name: 'Product Name',
          value: 'Keyboard'
        },
        {
          name: 'color',
          value: 'grey'
        },
        {
          name: 'weight (oz)',
          value: 5
        },
        {
          name: 'category',
          value: 'electronics'
        },
        {
          name: 'wireless',
          value: 'false'
        }
      ]
    },
    {
      properties: [
        {
          name: 'Product Name',
          value: 'Cup'
        },
        {
          name: 'color',
          value: 'white'
        },
        {
          name: 'weight (oz)',
          value: 3
        },
        {
          name: 'category',
          value: 'kitchenware'
        }
      ]
    },
    {
      properties: [
        {
          name: 'Product Name',
          value: 'Key'
        },
        {
          name: 'color',
          value: 'silver'
        },
        {
          name: 'weight (oz)',
          value: 1
        },
        {
          name: 'category',
          value: 'tools'
        }
      ]
    },
    {
      properties: [
        {
          name: 'Product Name',
          value: 'Hammer'
        },
        {
          name: 'color',
          value: 'brown'
        },
        {
          name: 'weight (oz)',
          value: 19
        },
        {
          name: 'category',
          value: 'tools'
        }
      ]
    }
  ],

  properties: [
    {
      name: 'Product Name',
      type: 'string'
    },
    {
      name: 'color',
      type: 'string'
    },
    {
      name: 'weight (oz)',
      type: 'number'
    },
    {
      name: 'category',
      type: 'enumerated',
      values: [
        'tools',
        'electronics',
        'kitchenware'
      ]
    },
    {
      name: 'wireless',
      type: 'enumerated',
      values: [
        'true',
        'false'
      ]
    }
  ],

  operators: [
    {
      text: 'Equals',
      id: 'equals'
    },
    {
      text: 'Is greater than',
      id: 'greater_than'
    },
    {
      text: 'Is less than',
      id: 'less_than'
    },
    {
      text: 'Has Any Value',
      id: 'any'
    },
    {
      text: 'Has No Value',
      id: 'none'
    },
    {
      text: 'Is any of',
      id: 'in'
    }
  ]
}
