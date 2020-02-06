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
        'SA': 0.174,
        'ST': 0.1723
      },
      'nationalValueType': 'median',
      'aboutDataHtml': "<span style='font-weight:bold'>This map shows the percent of people who are eligible for LSC services, those whose household income is below 125% of the Federal Poverty Guidelines.</span><br><span style='font-size:0.77rem; line-spacing: 0.7rem;'>The U.S. Census Bureau provides to LSC population estimates disaggregated at the LSC Service Area and State summary levels, along with estimates of the percent of the population below 125% of the Federal Poverty Guidelines. The data are from the 2018 American Community Survey 1-year population estimates and the 2018 Federal Poverty Guidelines. Summary level data for LSC Service Areas are unpublished, special tabulations made available on LSC's Civil Legal Aid Data site; state summary level information are published by the U.S. Census Bureau and are available at data.census.gov. Data for U.S. territories besides Puerto Rico are from the 2010 Decennial Census (tables PBG83 or PBG77). Data for the independent states of Republic of the Marshall Islands, Federated States of Micronesia, and Republic of Palau come from those countries’ governmental agencies. These independent states are not displayed on the map but are included under \"Micronesia\".</span>"
    },

    'data_pctChangePopEligible': {
      'dropdownName': 'Change in eligible pop',
      'tooltipName': 'Percent change in eligible population, \'17-\'18',
      'legendName': 'Percent change in eligible population, 2017 to 2018',
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
        'SA': -0.0219,
        'ST': -0.02175
      },
      'nationalValueType': 'median',
      'aboutDataHtml': "<span style='font-weight:bold'>This map shows the percent change from 2017 to 2018 in the number of income-eligible people, those whose household income is below 125% of the Federal Poverty Guidelines.</span><br><span style='font-size:0.77rem; line-spacing: 0.7rem;'>The U.S. Census Bureau provides to LSC population estimates disaggregated at the LSC Service Area and State summary levels, along with estimates of the percent of the population below 125% of the Federal Poverty Guidelines. The data are from the 2017 and 2018 American Community Survey 1-year population estimates and the 2017 and 2018 Federal Poverty Guidelines. Summary level data for LSC Service Areas are unpublished, special tabulations made available on LSC's Civil Legal Aid Data site; state summary level information are published by the U.S. Census Bureau and are available at data.census.gov. Data for U.S. territories besides Puerto Rico are from the 2010 Decennial Census (tables PBG83 or PBG77). Data for the independent states of Republic of the Marshall Islands, Federated States of Micronesia, and Republic of Palau come from those countries’ governmental agencies. These independent states are not displayed on the map but are included under \"Micronesia\"</span>."
    },

    'data_casesPer10K': {
      'dropdownName': 'Cases per 10K eligible',
      'tooltipName': 'Cases closed per 10,000 eligible people',
      'legendName': 'Number of cases closed per 10,000 eligible poeple',
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
        'SA': 129.2,
        'ST': 125.05
      },
      'nationalValueType': 'median',
      'aboutDataHtml': "<span style='font-weight:bold'>This map shows the number of Basic Field Grant cases closed per 10,000 income-eligible people, those whose household income is below 125% of the Federal Poverty Guidelines.</span><br><span style='font-size:0.77rem; line-spacing: 0.7rem;'>Case data are from the 2018 Grantee Activity Reports submitted to LSC from each grantee. The U.S. Census Bureau provides to LSC population estimates disaggregated at the LSC Service Area and State summary levels, along with estimates of the percent of the population below 125% of the Federal Poverty Guidelines. The data are from the 2017 and 2018 American Community Survey 1-year population estimates and the 2017 and 2018 Federal Poverty Guidelines. Summary level data for LSC Service Areas are unpublished, special tabulations made available on LSC's Civil Legal Aid Data site; state summary level information are published by the U.S. Census Bureau and are available at data.census.gov. Data for U.S. territories besides Puerto Rico are from the 2010 Decennial Census (tables PBG83 or PBG77). Data for the independent states of Republic of the Marshall Islands, Federated States of Micronesia, and Republic of Palau come from those countries’ governmental agencies. These independent states are not displayed on the map but are included under \"Micronesia\".</span>"
    }
  }
}
