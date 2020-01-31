var config = {
  //DEFAULT MAP COLOR for either not using data at all, or for no data selected from the data dropdown
  //COLORS
  'colors': {
    'mapDefault': {
      'style1': '#585858',
      'style2': '#007ABD'
    }
  },

  'data': {
    'none': {
      'dropdownName': 'None',
    },

    'data_pctOfPopEligible': {
      'dropdownName': 'Percent LSC eligible',
      'tooltipName': 'Percent eligible for LSC services',
      'legendName': 'Percent eligible for LSC services',
      'type': 'percent',
      'format': ',.0%',
      'domainMinForTooltip': 0, //would force this min or max rather than the min or max of the data
      'domainMaxForTooltip': null,
      'diverging': false,
      'colorThresholds': { //inner break points (one fewer than number of colors)
        'SA': [0.15, 0.20, 0.25, 0.30],
        'ST': [0.15, 0.20, 0.25, 0.30]
      },
      'nationalValue': {
        'SA': 0.1785,
        'ST': 0.17765
      },
      'nationalValueType': 'median',
      'aboutDataHtml': "<span style='font-weight:bold'>This map shows the percent of people who are eligible for LSC services, having income of 125% of the federal poverty line or below.</span> The data are from the U.S. Census Bureau's 2017 American Community Survey 1-year estimates. LSC receives this data disaggregated at the LSC Service Area and State summary levels. LSC Service Area summary level data are unpublished, special tabulations; state summary level information are published by the U.S. Census Bureau and are available via American FactFinder. For U.S. territories besides Puerto Rico, the data are from the 2010 Decennial Census, tables PBG83 or PBG77. Note that the eligibility figures used for Micronesia are an underestimate, as they reflect 100% of poverty."
    },

    'data_pctChangePopEligible': {
      'dropdownName': 'Change in eligible pop',
      'tooltipName': 'Percent change in eligible population, \'16-\'17',
      'legendName': 'Percent change in eligible population, 2016 to 2017',
      'type': 'percent',
      'format':	',.0%',
      'domainMinForTooltip': null,
      'domainMaxForTooltip': null,
      'diverging': true,
      'colorThresholds': {
        'SA': [-0.1, -0.05, 0, 0.05],
        'ST': [-0.1, -0.05, 0, 0.05]
      },
      'nationalValue': {
        'SA': -0.0285,
        'ST': -0.0256
      },
      'nationalValueType': 'median',
      'aboutDataHtml': "People with income of up to 125% of the official federal poverty line are eligible for LSC services. <span style='font-weight:bold'>This map shows the percent change from 2016 to 2017 in the number of income-eligible people.</span> The data are from the U.S. Census Bureau's 2016 and 2017 American Community Survey 1-year estimates. LSC receives this data disaggregated at the LSC Service Area and State summary levels. LSC Service Area summary level data are unpublished, special tabulations; state summary level information are published by the U.S. Census Bureau and are available via American FactFinder. For U.S. territories besides Puerto Rico, the data are from the 2010 Decennial Census, tables PBG83 or PBG77."
    },

    'data_casesPer10K': {
      'dropdownName': 'Cases per 10K poverty',
      'tooltipName': 'Cases closed per 10K people in poverty',
      'legendName': 'Number of cases closed per 10,000 people in poverty',
      'type': 'number',
      'format':	',.0f',
      'domainMinForTooltip': 0,
      'domainMaxForTooltip': null,
      'diverging': false,
      'colorThresholds': {
        'SA': [100, 150, 200, 250],
        'ST': [100, 150, 200, 250]
      },
      'nationalValue': {
        'SA': 169.55,
        'ST': 158.05
      },
      'nationalValueType': 'median',
      'aboutDataHtml': "<span style='font-weight:bold'>This map shows the number of Basic Field Grant cases closed per 10,000 people in poverty.</span> Case data are from the 2018 Grantee Activity Reports submitted to LSC from each grantee. Poverty data are from the U.S. Census Bureau's 2017 American Community Survey 1-year estimates. LSC receives this data disaggregated at the LSC Service Area and State summary levels. LSC Service Area summary level data are unpublished, special tabulations; state summary level information are published by the U.S. Census Bureau and are available via American FactFinder. For U.S. territories besides Puerto Rico, poverty data are from the 2010 Decennial Census, tables PBG83 or PBG77."
    }
  }
}
