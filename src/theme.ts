import chroma from 'chroma-js'

export const colors = {
  darkBlue: {
    base: '#35416C',
    darken1: '#35426c',
  },
  blue: {
    base: '#8cc9D0',
  },
  lightBlue: {
    base: '#cce7eb',
  },
  turquoise: {
    base: '#27a59c',
  },
  green: {
    base: '#75b44c',
  },
  darkGray: {
    base: '#333333',
  },
  lightGray: {
    base: '#cacaca',
  },
  yellow: {
    base: '#fff2cc',
  },
  orange: {
    base: '#f6b26b',
  },
  red: {
    base: '#cc0000',
  },
  darkRed: {
    base: '#990000',
  },
  darkViolet: {
    base: '#351c75',
  },
  darkPurple: {
    base: '#741b47',
  },
  purple: {
    lighten1: '#b71bdc',
  },
  grey: {
    base: '#ccc',
  },
}

export default {
  colors,
  leafletMapCircleMarkerProps: {
    primary: {
      radius: 4,
      weight: 1,
      opacity: 1,
      fillOpacity: 0.5,
      fillColor: colors.darkRed.base,
      color: colors.darkRed.base,
    },
    primarySelected: {
      radius: 8,
      weight: 3,
      opacity: 1,
      fillOpacity: 0.4,
      fillColor: chroma(colors.darkBlue.base)
        .brighten(2)
        .saturate(3)
        .toString(),
      color: chroma(colors.darkBlue.base)
        .brighten(2)
        .saturate(3)
        .toString(),
    },
  },
}
