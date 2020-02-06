"use strict";

(function () {

	//dataMenu = if data will be included for coloring the map, shows the full menu bar + variables dropdown
	//saFirst = default view is service areas. If false, state boundaries are shown and states button is before service areas button
	//animateIn = show an animation on map load? 0 = no animation, 1 = fade in, 2 = zoom in (10 + for experimental)
	//combineGU = if true, will show MP and GU as one combined area (sharing the same tooltip and box around it); otherwise, separately
	//mapStyle = pre-set styles for the menu bar and button colors, basic map color, etc.
	//linksOnTooltip = if true, the popup appears after a delay and can be moused over. If false, the state or service area itself can be clicked and the popup if for info only.
	//tooltipOnMouse = if true, the popup appears where the mouse is; if false, the popup appears off to the side of the geography. Use "true" if linksOnTooltip = true.
	//zoomOnClick = if true, clicking on a state or service area pans/zooms to it.
	//tooltipTitleOnly = if true, shows only the tooltip title, not the info section.

	function drawServiceAreas(dataMenu = true, saFirst = true, animateIn = 0, combineGU = true, mapStyle = 1, linksOnTooltip = true, tooltipOnMouse = true, zoomOnClick = false, tooltipTitleOnly = false) {

		mapStyle = 'style' + String(mapStyle);

		/////////////////////////////////////////
		////////// SETUP THE CANVAS /////////////
		/////////////////////////////////////////

		const mapDiv = d3.select('#map');
		mapDiv.attr('class', mapStyle);


		//Menu bar size depending on whether data will be shown
		let menuBarHeight = 35;
		const extraMenuHeightWithData = 35;

		if (dataMenu === true) {
			menuBarHeight = menuBarHeight + extraMenuHeightWithData;
		}

		//Width and height of map
		const width = parseInt(mapDiv.style("width")); //per css
		const height = dataMenu === true ? width * 0.75 : width * 0.75 - menuBarHeight;

		//const width = document.getElementById("map").offsetWidth;
		//const height = document.getElementById("map").offsetHeight;

		const svg = mapDiv
			.append("svg")
			.style("overflow", "hidden")
			.attr("width", width)
			.attr("height", height);



		////////// INSTRUCTION TEXT ///////////
		const instructionsTextG = svg.append('g')
			.attr('id', 'instructionsG')
			.attr('transform', `translate(10, ${height-30})`);

		instructionsTextG
			.append('text')
				.text(`${linksOnTooltip === false ? 'Click a state or service area to see its profile.' : 'Mouse over an area for more info.'}`)
				.style('visibility', function(){ return width > 745 ? 'visible' : 'hidden'; })
				.attr('class', `instructions ${linksOnTooltip === false ? 'instructions-bold' : ''}`);

		instructionsTextG
			.append('text')
				.text('Drag to pan. Scroll to zoom.')
				.attr('class', 'instructions')
				.style('visibility', function(){ return width > 745 ? 'visible' : 'hidden'; })
				.attr('transform', 'translate(0,20)');


		///////////////////////////////////////////////////
		////////// MAP STUFF BEFORE DATA LOAD /////////////
		///////////////////////////////////////////////////

		const mapZoomSensor = svg.append('g')
			.attr('id', 'mapZoomSensor');

		const mapZoomRect = mapZoomSensor.append('rect') //for background zoom and pan to work
			.attr('id', 'mapZoomRect')
			.attr('class', mapStyle)
			.attr('width', width)
			.attr('height', height - menuBarHeight)
			.attr('transform', 'translate(' + 0 + ',' + menuBarHeight + ')');

		const mapsG = mapZoomSensor.append('g')
			.attr('id', 'mapsG')
			.attr('height', height - menuBarHeight)
			.attr('transform', 'translate(' + 0 + ',' + menuBarHeight + ')');

		// D3 Projection
		const projection = d3.geoAlbersUsaTerritories()
			.translate([width / 1.91, (height - menuBarHeight) / 2.15]) // to center on screen
			.scale([width * 1.225]); //how far zoomed for entire US to be in the svg


		// Define path generator
		const path = d3.geoPath()
			.projection(projection); // tell path generator to use albersUsa projection


		// Set the zoom and limits
		const zoom = d3.zoom()
			.scaleExtent([1,20])
			.translateExtent([[-width/2, -height/2], [width*1.5, height*1.5]])
			.extent([[0, 0], [width, height]])
			.on('zoom', zoomed)
			.on('end', function() {
				mapsG.selectAll('path').style('pointer-events', 'auto');

				//hide the reset button if returned to normal position and zoom
				if (d3.event.transform.k == 1 && d3.event.transform.x == 0 && d3.event.transform.y == 0) {
					resetG
						.style('pointer-events', 'none')
						.transition()
						.duration(1000)
						.style('opacity', 0);
				}
			});

		mapZoomSensor.call(zoom);


		//Layers containers (to be in this order)
		const baseG = mapsG.append('g').attr('id', 'baseG');

		const states = mapsG.append('g')
			.attr('id', 'statesG');

		const serviceAreas = mapsG.append("g")
			.attr('id', 'serviceAreasG');

		// Rectangles around territories (to sense mouseover for easier highlight)
		let territoryBoxes;
		if (combineGU === true) {
			territoryBoxes = ['MP', 'PR', 'VI', 'AS'];
		} else if (combineGU === false) {
			territoryBoxes = ['GU', 'MP', 'PR', 'VI', 'AS'];
		}

		mapsG.selectAll('.territoryBox')
			.data(territoryBoxes)
			.enter()
			.append('rect')
			.attr('class', 'territoryBox ' + mapStyle)
			.attr('id', function(d) { return 'territoryBox' + d; });

		d3.select('#territoryBoxMP')
			.attr('height', `${combineGU === true ? height * 0.22 : height * 0.189}`)
			.attr('width', width * 0.05)
			.attr('x', width * 0.004)
			.attr('y', `${dataMenu === true ? height * 0.335 : height * 0.365}`); // !!!! THESE VALUES ARE TRIAL AND ERROR TO GET THE RECTANGLES THE RIGHT SIZE AND POSITION AT DIFFERENT WINDOW SIZES. BETTER SOLUTION?

			if (combineGU === false) {
				d3.select('#territoryBoxGU')
					.attr('height', (height - menuBarHeight) * 0.032)
					.attr('width', width * 0.05)
					.attr('x', width * 0.004)
					.attr('y', `${dataMenu === true ? height * 0.525 : height * 0.555}`);
			}

		d3.select('#territoryBoxAS')
			.attr('height', (height - menuBarHeight) * 0.040)
			.attr('width', width * 0.083)
			.attr('x', width * 0.004)
			.attr('y', `${dataMenu === true ? height * 0.56 : height * 0.59}`);

		d3.select('#territoryBoxPR')
			.attr('height', (height - menuBarHeight) * 0.05)
			.attr('width', width * 0.064)
			.attr('x', width * 0.905)
			.attr('y', `${dataMenu === true ? height * 0.75 : height * 0.795}`);

		d3.select('#territoryBoxVI')
			.attr('height', (height - menuBarHeight) * 0.05)
			.attr('width', width * 0.025)
			.attr('x', width * 0.97)
			.attr('y', `${dataMenu === true ? height * 0.75 : height * 0.795}`);


		// Drop shadow. http://bl.ocks.org/rveciana/8246015
		const filter = svg.append("defs")
			.append("filter")
			.attr("id", "drop-shadow")
			.attr("height", "130%");
		filter.append("feGaussianBlur")
		.attr("in", "SourceGraphic")
		.attr("stdDeviation", 1.8)
		.attr("result", "blur");

		filter.append("feOffset")
			.attr("in", "blur")
			.attr("dx", 1.8)
			.attr("dy", 1.8)
			.attr("result", "offsetBlur");

		const feMerge = filter.append("feMerge");

		feMerge.append("feMergeNode")
			.attr("in", "offsetBlur")
		feMerge.append("feMergeNode")
			.attr("in", "SourceGraphic");


		/////////////////////////////////////////////
		///////////////// MENU BAR //////////////////
		/////////////////////////////////////////////
		let selectedLayer = (saFirst === true) ? 'SA' : 'ST';

		let toggleRounding = 5,
					toggleHeight = 27,
					toggleWidth = 150,
					toggleGap = 10; //space between

		if (dataMenu === true) {
			var selectLayerHeaderFromLeft = width > 745 ? 25 : 0,
					selectLayerHeaderFromTop = (menuBarHeight/2) - 5,
					selectLayerHeaderFromTop2 = selectLayerHeaderFromTop + 23,
					menuTriangleWidth = 15,
					menuTriangleHeight = 30,
					menuTriangleFromLeft = width > 745 ? selectLayerHeaderFromLeft + 85 : 0,
		 			toggleOneFromLeft = width > 745 ? menuTriangleFromLeft + 60 : 20,
		 			toggleFromTop = 34,
		 			toggleTextFromTop = toggleFromTop + 20,
					menuTriangleFromLeft2 = toggleOneFromLeft + 350,
					resetZoomTextFromTop = toggleFromTop + 50,
					menuTextFromTop = 23,
					menuTextFromTop2 = menuTextFromTop + 20,
					dropdownFromTop = (menuBarHeight/2) + 8,
					dropdownFromLeft = menuTriangleFromLeft2 + 45,
					menuTextFromLeft1 = toggleOneFromLeft + 150,
					menuTextFromLeft2 = dropdownFromLeft + 75,
					aboutDataFromLeft = width > 830 ? menuTextFromLeft2 + 145 : menuTextFromLeft2 + 12,
					aboutDataFromLeft2 = width > 830 ? aboutDataFromLeft : menuTextFromLeft2 + 16;
		} else if (dataMenu === false) {
			var	toggleFromTop = 4,
					toggleOneFromLeft = (width / 2) - toggleWidth - (toggleGap / 2),
					toggleTextFromTop = toggleFromTop + 20;
		}

		let slidingBorderFromTop = toggleFromTop + toggleHeight + 2;

		const menuBarG = svg.append('g')
			.attr('id', 'menuBarG');

		const menuBar = menuBarG.append('rect')
			.attr('id', 'menuBarRect')
			.attr('class', mapStyle)
			.attr('width', width)
			.attr('height', menuBarHeight);

		if (dataMenu == true) {
			const selectLayerHeader = menuBarG.append('text')
				.attr('class', 'selectLayerHeader ' + mapStyle)
				.text('Select')
				.attr('visibility', function(){ return width > 745 ? 'visible' : 'hidden'; })
				.attr('transform', 'translate(' + selectLayerHeaderFromLeft + ',' + selectLayerHeaderFromTop + ')');

			const selectLayerHeader2 = menuBarG.append('text')
				.attr('class', 'selectLayerHeader ' + mapStyle)
				.text('Layers')
				.attr('visibility', function(){ return width > 745 ? 'visible' : 'hidden'; })
				.attr('transform', 'translate(' + selectLayerHeaderFromLeft + ',' + selectLayerHeaderFromTop2 + ')');

			menuBarG.append('path')
				.attr('d', `M 0 0 L ${menuTriangleWidth} ${menuTriangleHeight/2} L 0 ${menuTriangleHeight} Z`)
				.attr('id', 'menuTriangle1')
				.attr('class', 'menuTriangle ' + mapStyle)
				.attr('visibility', function(){ return width > 745 ? 'visible' : 'hidden'; })
				.attr('transform', `translate(${menuTriangleFromLeft}, ${menuBarHeight/2 - menuTriangleHeight/2})`);

			menuBarG.append('path')
				.attr('d', `M 0 0 L ${menuTriangleWidth} ${menuTriangleHeight/2} L 0 ${menuTriangleHeight} Z`)
				.attr('id', 'menuTriangle2')
				.attr('class', 'menuTriangle style ' + mapStyle)
				.attr('transform', `translate(${menuTriangleFromLeft2}, ${menuBarHeight/2 - menuTriangleHeight/2})`);

			const selectLayerText = menuBarG.append('text')
				.attr('class', 'menuBarText ' + mapStyle)
				.text(function() { return width > 745 ? 'Geography' : 'Geography Layer'; })
				.attr('transform', 'translate(' + menuTextFromLeft1 + ',' + menuTextFromTop + ')');
		}


		const serviceAreasToggleG = menuBarG.append('g')
			.attr('class', 'toggle')
			.attr('id', 'serviceAreasToggleG')
			.on('mouseover', function(){
				d3.select('#serviceAreasToggle').classed('toggleHovered', true);
			})
			.on('mouseout', function(){
				d3.select('#serviceAreasToggle').classed('toggleHovered', false);
			});

		const serviceAreasToggleRect = serviceAreasToggleG.append('rect')
			.attr('height', toggleHeight + 'px')
			.attr('width', toggleWidth + 'px')
			.attr('rx', toggleRounding)
			.attr('ry', toggleRounding)
			.attr('id', 'serviceAreasToggle')
			.attr('class', `${saFirst === true ? 'mapToggle mapToggled' : 'mapToggle'} ${mapStyle}`)
			.attr('transform',`translate(${saFirst === true ? toggleOneFromLeft : toggleOneFromLeft + toggleWidth + toggleGap},${toggleFromTop})`);

		const serviceAreasToggleText = serviceAreasToggleG.append('text')
			.text('Service Areas')
			.attr('id', 'serviceAreasToggleText')
			.attr('class', `${saFirst === true ? 'toggleText mapToggledText' : 'toggleText'} ${mapStyle}`)
			.attr('transform',`translate(${saFirst === true ? toggleOneFromLeft + (toggleWidth/2) : toggleOneFromLeft + toggleWidth + toggleGap + (toggleWidth/2)},${toggleTextFromTop})`);

		const statesToggleG = menuBarG.append('g')
			.attr('class', 'toggle')
			.attr('id', 'statesToggleG')
			.on('mouseover', function(){
				d3.select('#statesToggle').classed('toggleHovered', true);
			})
			.on('mouseout', function(){
				d3.select('#statesToggle').classed('toggleHovered', false);
			});

		const statesToggleRect = statesToggleG.append('rect')
			.attr('height', toggleHeight + 'px')
			.attr('width', toggleWidth + 'px')
			.attr('rx', toggleRounding)
			.attr('ry', toggleRounding)
			.attr('id', 'statesToggle')
			.attr('class', `${saFirst === false ? 'mapToggle mapToggled' : 'mapToggle'} ${mapStyle}`)
			.attr('transform',`translate(${saFirst === false ? toggleOneFromLeft : toggleOneFromLeft + toggleWidth + toggleGap},${toggleFromTop})`);

		const statesToggleText = statesToggleG.append('text')
			.text('States & Territories')
			.attr('id', 'statesToggleText')
			.attr('class', `${saFirst === false ? 'toggleText mapToggledText' : 'toggleText'} ${mapStyle}`)
			.attr('transform',`translate(${saFirst === false ? toggleOneFromLeft + (toggleWidth/2) : toggleOneFromLeft + toggleWidth + toggleGap + (toggleWidth/2)},${toggleTextFromTop})`);


		//Sliding button bottom border effect for style 2
		let slidingBorder;
		if (mapStyle === 'style2') {
			slidingBorder = menuBarG.append('rect')
				.attr('id', 'slidingBorder')
				.attr('class', mapStyle)
				.attr('height', 6)
				.attr('width', toggleWidth)
				.attr('transform',`translate(${toggleOneFromLeft},${slidingBorderFromTop})`);
		}

		let selectedData = 'none', selectDataText, dataSelect;

		if (dataMenu == true) {
			selectDataText = menuBarG.append('text')
				.text(function() { return width > 745 ? 'Map Data' : 'Data Layer'; })
				.attr('class', 'menuBarText ' + mapStyle)
				.attr('transform', 'translate(' + menuTextFromLeft2 + ',' + menuTextFromTop + ')');

			dataSelect = mapDiv.append('select')
				.attr('id','dataSelect')
				.attr('class','dropdown select-css')
				.style('left', dropdownFromLeft + 'px')
				.style('top', dropdownFromTop + 'px');

			dataSelect.selectAll('option')
				.data(Object.keys(config.data))
				.enter()
				.append('option')
					.text(function(d) { return config.data[d].dropdownName })
					.attr('value', function(d) { return d });

			selectedData = document.getElementById('dataSelect').value;


			// About data source text and pop-up
			const aboutDataLabels = menuBarG.append('g');

			const aboutDataLabel = aboutDataLabels.append('text')
				.attr('class', `aboutDataLabel ${mapStyle}${width < 830 ? ' aboutLabelLower' : ''}`)
				.text('About this')
				.style('text-anchor', `${width > 830 ? 'middle' : 'end'}`)
				.attr('transform', `translate(${aboutDataFromLeft}, ${width > 830 ? 30 : menuBarHeight + 20})`);

			const aboutDataLabel2 = aboutDataLabels.append('text')
				.attr('class', `aboutDataLabel ${mapStyle}${width < 830 ? ' aboutLabelLower' : ''}`)
				.text('data...')
				.style('text-anchor', `${width > 830 ? 'middle' : 'start'}`)
				.attr('transform', `translate(${aboutDataFromLeft2}, ${width > 830 ? 50 : menuBarHeight + 20})`);

			aboutDataLabels.on('mouseover', function(){
					d3.select('#aboutDataDiv').transition().duration(500).style('opacity', 1);
				})
				.on('mouseout', function(){
					d3.select('#aboutDataDiv').transition().duration(500).style('opacity', 0);
				});

			const aboutDataDivWidth = 400;

			mapDiv.append('div')
				.attr('id', 'aboutDataDiv')
				.attr('class', mapStyle)
				.style('position', 'absolute')
				.style('width', aboutDataDivWidth + 'px')
				.style('height', 'auto')
				.style('top', `${width > 830 ? menuBarHeight + 15 : menuBarHeight + 30}px`)
				.style('right', `${width > 830 ? 15 : 30}px`)
				.html('');
		}


		// Reset button
		const resetG = svg.append('g')
			.attr('id', 'resetG')
			.attr('transform',`translate(28, ${menuBarHeight + 40})`)
			.style('opacity', 0)
			.style('pointer-events', 'none')
			.on('mouseover', function() { cancelTooltips(); })
			.on('click', function() {
				resetZoom();
			});

		resetG.append('rect')
			.attr('width', 130)
			.attr('height', 40)
			.style('fill', '#fff')
			.attr('rx', 10)
			.attr('ry', 10)
			.attr('transform', 'translate(-22, -33)');

		const homeIcon = resetG.append('text')
			.attr('text-anchor', 'middle')
			.attr('class', 'fa resetZoomIcon')
			.style('font-size', '40px')
			.text('\uf015');

		const resetZoomText1 = resetG.append('text')
			.text('Reset pan')
			.attr('id', 'resetZoomText1')
			.attr('class', 'resetZoomText')
			.attr('transform', 'translate(61,-17)');

		const resetZoomText2 = resetG.append('text')
			.text('and zoom')
			.attr('id', 'resetZoomText2')
			.attr('class', 'resetZoomText')
			.attr('transform', 'translate(61,-2)');


		//////////////////////////////
		////////// LEGEND ////////////
		//////////////////////////////
		const legendRectHeight = 8,
					legendRectWidth = 90,
					legendRectSpacing = 100,
					legendSensorRectHeight = 25,
					legendBkgdRectHeight = 55,
					legendFromLeft = width < 670 ? width / 2 - legendRectSpacing * 2.5 : width - 500;
		let legendG;

		if (dataMenu === true) {
			legendG = svg.append('g')
				.attr('id', 'legendG')
				.on('mouseover', function() { cancelTooltips(); });

			legendG.append('rect')
				.attr('id', 'legendBkgdRect')
				.attr('width', legendRectSpacing * 5)
				.attr('height', legendBkgdRectHeight)
				.attr('rx', 2)
				.attr('ry', 2)
				.attr('transform', `translate(${legendFromLeft - 5}, ${height - legendBkgdRectHeight - 3})`);

			const legendTitle = legendG.append('text')
				.text('People per capita') //placeholder
				.attr('id', 'legendTitle')
				.style('text-anchor', 'middle')
				.attr('transform', `translate(${legendFromLeft + 2.5 * legendRectSpacing}, ${height-40})`);
				//`translate(${width > 745 ? width - 250 : width * 0.67}, ${height-45})`);

			const legendItems = legendG.selectAll('.legendItem')
				.data([1,2,3,4,5])
				.enter().append('g')
				.attr('class', 'legendItems')
				.attr('id', (d,i) => `legendItem${String(i+1)}`)
				.attr('transform', (d,i) =>`translate(${legendFromLeft + i * legendRectSpacing}, ${height - 15})`);

			legendItems.each(function(d,i) {

				d3.select(this).append('rect')
					.attr('class', 'legendBackgroundRect')
					.attr('width', legendRectSpacing)
					.attr('height', legendSensorRectHeight)
					.style('fill', '#fff')
					.style('opacity', 0)
					.attr('transform', (i) => `translate(0, ${-legendSensorRectHeight})`);

				d3.select(this).append('rect')
					.attr('class', 'legendRect')
					.attr('width', legendRectWidth)
					.attr('height', legendRectHeight)
					.attr('id', (i) => `legendRect${String(i)}`);

				d3.select(this).append('text')
					.text((i) => i)
					.attr('class', 'legendValues')
					.attr('id', (i) => `legendValue${String(i)}` )
					.attr('transform', (i) => `translate(${legendRectWidth/2}, ${-5})`);

				//Hover effect
				d3.select(this)
					.on('mouseover', function(i) {
						d3.selectAll(`.dataLayer:not(.group${i})`).classed('legendHoveredNo', true);
					})
					.on('mouseout', function(i) {
						d3.selectAll(`.dataLayer:not(.group${i})`).classed('legendHoveredNo', false);
					});
			});
		}



		/*
		const legendRects = legendG.selectAll('.legendRects')
			.data([1,2,3,4,5])
			.enter().append('rect')
			.attr('class', 'legendRect')
			.attr('width', legendRectWidth)
			.attr('height', legendRectHeight)
			.attr('id', (d,i) => `legendRect${String(i+1)}`)
			.attr('transform', (d,i) =>`translate(${(width/2.5) + i * 100}, ${height - 15})`);

		const legendValues = legendG.selectAll('.legendValues')
			.data([1,2,3,4,5])
			.enter().append('text')
			.text((d) => d)
			.attr('class', 'legendValues')
			.attr('id', (d,i) => `legendValue${String(i+1)}` )
			.attr('transform', (d,i) => `translate(${(width/2.5 + legendRectWidth/2) + i * 100}, ${height - 20})`);

		 */


		////////////////////////////////////////////
		////////// TOOLTIP DEFINITIONS /////////////
		////////////////////////////////////////////

		let tooltipWidth = tooltipTitleOnly === true ? 150 : 220;

		const tooltipYOffset = -50,
				tooltipXOffset = {'right':15, 'left': -(tooltipWidth + 15)};

		let tipAppearTimeout,
				tipDisappearTimeout;

		let appearDelay, appearFadeIn, disappearDelay;

		if (linksOnTooltip === true) {
			appearDelay = 600;
			appearFadeIn = 500;
			disappearDelay = 599;
		} else if (linksOnTooltip === false) {
			appearDelay = 400;
			appearFadeIn = 250;
			disappearDelay = 99;
		}

		let tipXAxisWidth; //to be updated in updateDomain
		const tipXAxisFromLeft = 15,
					tipBarHeight = 25,
					tipBarGap = 5,
					tipSvgHeight = tipBarHeight * 2 + tipBarGap;

		const tipXScale = d3.scaleLinear()
					.domain([0,0.5]); //to be re-calculated in updateDomain

		//keep track of mouse position in order to use that position AFTER the tooltip appear timeout (otherwise could capture the mouse position with d3.mouse at the moment of hovering over the tooltip, but it may not quite match the position after the timeout)
		let mousePos;

		svg.on('mousemove', function() { mousePos = d3.mouse(this); });




		////////////////////////////////////////////////
		////////// CHLOROPLETH COLOR SCALE /////////////
		////////////////////////////////////////////////
		//const colorsQuantize = ["#62BED2", "#3D91BE", "#2D5E9E", "#24448E", "#162065"];
		const colors5 = ["#73d487", "#30b096", "#288993", "#40607a", "#453b52"];
		const colorsDiverging5 = ["#E56153", "#FD9D62", "#FFC479", "#288993", "#40607a"]; //#FEA968 #FDDB87


		let colorScheme = d3.scaleThreshold();


		//////////////////////////////////////////////////////////////
		////////// PRIMARY GEOJSON READ AND MAP CREATION /////////////
		//////////////////////////////////////////////////////////////

		queue()
			.defer(d3.json, "geo_data/service_areas_topojson_2020_01_16.json")
			.defer(d3.json, "geo_data/mapAreasData_keyed.json")
			.await(ready);

		function ready(error, areasJson, mapAreasData) {
			if (error) throw error;

			const serviceAreasData = topojson.feature(areasJson, areasJson.objects.service_areas).features;

			//Add service area data to each spatial feature
			//State data will be added later after state boundaries are created by dissolving SA boundaries
			serviceAreasData.forEach(function(d) {
				d.properties = Object.assign({}, d.properties, mapAreasData[d.properties.ServArea_1]);
			});

			////////////// TOOLTIPS ///////////////
			//Creating individual divs instead of one moving div in order to handle entrances and exits separately when moving between states or service areas, which will allow smoother ability to get onto the tooltip and access the hyperlink without accidentally switching to a different tooltip en-route.

			//Create list of service areas and list of states
			const SAs = [];
			for (const SA of serviceAreasData) {
				SAs.push(SA.properties.ServArea_1)
			}

			let STs;

			STs = [ 'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK', 'OR', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY'];

			const dataSubsetST = d3.entries(mapAreasData).filter(function(d) { return STs.includes(d.key); });
			const dataSubsetSA = d3.entries(mapAreasData).filter(function(d) { return !STs.includes(d.key); })


			////////////// LAYER 1 //////////////
			//State-level path elements as union of service areas per state abbreviation property
			//https://bl.ocks.org/mbostock/5416405
			//http://mechanicalscribe.com/notes/topojson-mesh-vs-merge/ or https://bl.ocks.org/wilson428/da8c414874780bef3e89

			const statePaths = [];

			for (let ST of STs) {
				let stateMerged = topojson.merge(areasJson, areasJson.objects.service_areas.geometries.filter(function(d) { return d.properties.StAbbrev == ST }));

				stateMerged.stAbbrev = ST;

				statePaths.push(stateMerged);
			}

			//Add the data from the data json
			statePaths.forEach(function(d) {
				d.properties = mapAreasData[d.stAbbrev];
			});

			states.selectAll('.states')
				.append('path')
				.data(statePaths)
				.enter()
				.append('path')
				.attr('id', function(d) { return d.stAbbrev; })
				.attr('class', 'geo states dataLayer nonScaling ' + mapStyle)
				.attr('d', function(d) { return path(d); });


			/*
			//If desired...one map path element of all service area boundaries
			svg.append("path")
				 .datum(topojson.feature(areasJson, areasJson.objects.service_areas))
				 .attr("class", "serviceAreas")
				 .attr("d", path);
			*/

			////////////// LAYER 2 //////////////
			//Service areas path elements
			serviceAreas.selectAll('path')
				.data(serviceAreasData)
				.enter()
				.append('path')
				.attr('id', function(d) { return d.properties.ServArea_1})
				.attr('class','geo serviceAreas dataLayer nonScaling ' + mapStyle)
				.attr('d', path);

			////////////// LAYER 3 //////////////
			//Interior states borders as one path object. No data or interactivity. This is just preferrable to a thicker border on all state borders, which is too thick and unnecessary on states like Alaska.
			mapsG.append("path")
				.datum(topojson.mesh(areasJson,
					areasJson.objects.service_areas, function(a, b) { return a.properties.StAbbrev !== b.properties.StAbbrev; }))
				.attr("class", "geo stateInteriorMesh nonScaling")
				.attr("d", path);


			if (dataMenu === true) {
				//Set initial domains
				selectedLayer == 'SA'? updateDomains(dataSubsetSA) : updateDomains(dataSubsetST);
			}

			//Set initial color paths
			updateColors();

			//////////// Create the tooltip divs ////////////
			const tooltips = mapDiv.selectAll('.tooltip')
				.data(SAs.concat(STs))
				.enter()
				.append('div')
				.attr('class', `tooltip${tooltipTitleOnly === true? ' tipTitleOnly' : ''}`)
				.attr('id', function(d) {
					return d + '-tip';
				})
				.style('width', tooltipWidth+'px')
				.style('height','auto');

			//Header
			tooltips.append('p')
				.attr('class', 'tipHeaderP ' + mapStyle)
				.append('span')
				.attr('class', 'tipHeaderSpan')
			.text(function(d) {
				return mapAreasData[d].name;
			})
			;

			if (linksOnTooltip === false) {
				d3.selectAll('.tooltip').style('pointer-events', 'none');
				d3.selectAll('.geo, .territoryBox').style('cursor', 'pointer');
			}

			// DATA GRAPH PORTION OF TOOLTIP //
			let tipDataDiv, tipGraphSvg, tipInfo;
			if (tooltipTitleOnly === false) {
				tipDataDiv = tooltips.append('div')
					.attr('class', 'tipDataDiv')
					.style('display', 'none');

				tipDataDiv
					.append('p')
					.attr('class', 'tipGraphHeader');

				tipDataDiv.append('p')
					.attr('class', 'tipGraphCategory')
					.html((d) => `This area (${d})`)
					.style('padding-left', tipXAxisFromLeft + 'px');

				tipGraphSvg = tipDataDiv
					.append('svg')
					.attr('class', 'tipGraphSvg')
					.attr('height', tipSvgHeight + 'px')
					.attr('width', tooltipWidth + 'px');

				tipDataDiv.append('p')
					.attr('class', 'tipGraphCategory tipNationalLabel')
					.style('padding-left', tipXAxisFromLeft + 'px');

				tipDataDiv.append('p')
					.attr('class', 'tipGraphFootnote');

				//Info such as subheader, description, profile link
				tipInfo = tooltips.append('div')
					.attr('class', 'tipContentDiv tipInfoSection');

				tipInfo
				.append('div')
				.attr('class', 'tipLink')
				.html(function(d) {
					if (STs.includes(d) && mapAreasData[d].profileType == 'org') {
						return '<a href="' + mapAreasData[d].link + '"><span>' + "See the sole grantee's profile" + '</span></a>';
					} else if (STs.includes(d)) {
						return '<a href="' + mapAreasData[d].link + '"><span>' + "See the aggregate state profile" + '</span></a>';
					} else {
						return '<a href="' + mapAreasData[d].link + '"><span>' + "See this grantee's profile" + '</span></a>';
					}
				});
			}

			//////// CLICK / MOUSEOVER / MOUSEOUT ACTIONS THAT DEPEND ON DATA /////////
			d3.selectAll('.states')
				.on('click', function(d) {
					if (linksOnTooltip === false) {
						window.open(d.properties.link, '_blank');
					}
					if (zoomOnClick === true) {
						areaClick(d, 'ST');
					}
				})
				.on('mouseover', function(d) {
					mapMouseover(d, 'ST');
					clearTimeout(tipAppearTimeout); //cancel any tooltip appear timeouts that were started when mouse passed over other areas en route to here
					showTooltip(d, 'ST');
				})
				.on('mouseout', function(d) {
					mapMouseout(d, 'ST');
				});

			d3.selectAll('.serviceAreas')
				.on('click', function(d) {
					if (linksOnTooltip === false) {
						window.open(d.properties.link, '_blank');
					}
					if (zoomOnClick === true) {
						areaClick(d, 'SA');
					}
				})
				.on('mouseover', function(d) {
					mapMouseover(d, 'SA');
					clearTimeout(tipAppearTimeout); //cancel any tooltip appear timeouts that were started when mouse passed over other areas en route to here
					showTooltip(d, 'SA');
				})
				.on('mouseout', function(d) {
					mapMouseout(d, 'SA');
				});


			// Territory rectangles mouseover effects
			d3.selectAll('.territoryBox')
				.each(function(d) {
					d3.select(this)
						.on('click', function(d) {
							if (linksOnTooltip === false) {
								window.open(mapAreasData[d].link, '_blank');
							}
							if (zoomOnClick === true) {
								// FOR FUTURE DEVELOPMENT
							}
						})
						.on('mouseover', function(d) {
							if (selectedLayer == 'SA') {
								mapMouseover(d3.select(`#${d}-1`).data()[0], 'SA');
								clearTimeout(tipAppearTimeout);
								showTooltip(d3.select(`#${d}-1`).data()[0], 'SA');
								d3.select(this).classed('hoveredBox', true);
							} else {
								mapMouseover(d3.select(`#${d}`).data()[0], 'ST');
								clearTimeout(tipAppearTimeout);
								showTooltip(d3.select(`#${d}`).data()[0], 'ST');
								d3.select(this).classed('hoveredBox', true);
							}
					})
					.on('mouseout', function(d) {
						if (selectedLayer == 'SA') {
							mapMouseout(d3.select(`#${d}-1`).data()[0], 'SA');
							d3.select(this).classed('hoveredBox', false);
						} else {
							mapMouseout(d3.select(`#${d}`).data()[0], 'ST');
							d3.select(this).classed('hoveredBox', false);
						}
					});
				});


			const showServiceAreas = function() {
				//If style 2, slide the menu border bottom into position
				if (mapStyle === 'style2') {
					slidingBorder.transition()
						.duration(1000)
						.ease(d3.easeCubicInOut)
						.attr('transform', `translate(${saFirst === true ? toggleOneFromLeft : toggleOneFromLeft + toggleWidth + toggleGap},${slidingBorderFromTop})`);
				}

				//Switch map layer
				d3.selectAll('.serviceAreas').classed('inactiveLayer', false);
				d3.selectAll('.states').classed('inactiveLayer', true);

				//re-style the buttons
				d3.select('#serviceAreasToggle').classed('mapToggled', true);
				d3.select('#statesToggle').classed('mapToggled', false);
				d3.select('#serviceAreasToggleText').classed('mapToggledText', true);
				d3.select('#statesToggleText').classed('mapToggledText', false);

				//update domains, colors, etc.
				selectedLayer = 'SA';

				if (dataMenu === true) {
					updateDomains(dataSubsetSA);
					updateColors();
				}
			}

			const showStates = function() {
				//If style 2, slide the menu border bottom into position
				if (mapStyle === 'style2') {
					slidingBorder.transition()
						.duration(1000)
						.ease(d3.easeCubicInOut)
						.attr('transform', `translate(${saFirst === false ? toggleOneFromLeft : toggleOneFromLeft + toggleWidth + toggleGap},${slidingBorderFromTop})`);
				}

				//Switch map layer
				d3.selectAll('.states').classed('inactiveLayer', false);
				d3.selectAll('.serviceAreas').classed('inactiveLayer', true);

				//re-style the buttons
				d3.select('#serviceAreasToggle').classed('mapToggled', false);
				d3.select('#statesToggle').classed('mapToggled', true);
				d3.select('#serviceAreasToggleText').classed('mapToggledText', false);
				d3.select('#statesToggleText').classed('mapToggledText', true);

				//update domains, colors, etc.
				selectedLayer = 'ST';

				if (dataMenu === true) {
					updateDomains(dataSubsetST);
					updateColors();
				}
			}

			serviceAreasToggleG.on('click', function(){ showServiceAreas(); })

			statesToggleG.on('click', function(){ showStates(); })

			// What to show first
			if (saFirst === true) {
				showServiceAreas();
			} else if (saFirst === false) {
				showStates();
			}


			if (dataMenu === true) {
				dataSelect.on('change', function(areasJson) {
					selectedData = document.getElementById('dataSelect').value;

					selectedLayer == 'SA'? updateDomains(dataSubsetSA) : updateDomains(dataSubsetST);

					updateColors(true);

					if (selectedData != 'none') {
						d3.selectAll('.aboutDataLabel')
							.style('pointer-events', 'auto')
							.transition()
							.duration(2000)
							.style('opacity', 1);

						d3.select('#aboutDataDiv').html(config.data[selectedData].aboutDataHtml);
					} else {
						d3.selectAll('.aboutDataLabel')
							.style('pointer-events', 'none')
							.transition()
							.duration(2000)
							.style('opacity', 0)
							.transition()
					}
				});
			}

			if (animateIn > 0) {
				initialAnimation(areasJson);
			} else if (animateIn === 0) {
				d3.selectAll('.territoryBox').style('stroke-opacity', 1);
			}
		}; //end of d3.json geojson readingfunction


		//////////////////////////////////////////////////////
		///////// Map click to pan & center function /////////
		//////////////////////////////////////////////////////
		//https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2

		let selected = 'AK';

		function areaClick(d, scope) {
			//clear prior selected styling
			d3.select(selected)
				.classed('selected', false);

			let selectedId, selectedClass;
			if (scope == 'ST') {
				selectedId = `#${d.stAbbrev}`;
				selectedClass = '.states';
			} else if (scope == 'SA') {
				selectedId = `#${d.properties.ServArea_1}`;
				selectedClass = '.serviceAreas'
			}

			selected = selectedId;
			d3.select(selected)
				.classed('selected', true);

			const bounds = path.bounds(d),
					dx = bounds[1][0] - bounds[0][0],
					dy = bounds[1][1] - bounds[0][1],
					x = (bounds[0][0] + bounds[1][0]) / 2,
					y = (bounds[0][1] + bounds[1][1]) / 2,
					scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
					translate = [width / 2 - scale * x, height / 2 - scale * y];

			mapZoomSensor.transition()
					.duration(750)
					// .call(zoom.translate(translate).scale(scale).event); // not in d3 v4
					.call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) )
		}



		////////////////////////////////////////////////
		///////// UPDATE DOMAINS AND COLORS ////////////
		////////////////////////////////////////////////

		function updateDomains(data) {

			if (selectedData == 'none') {
				d3.select('#legendTitle')
					.transition()
					.duration(1500)
					.delay(0)
					.style('opacity', 0);

				d3.select('#legendBkgdRect')
					.style('pointer-events', 'none')
					.transition()
					.duration(1500)
					.delay(0)
					.style('opacity', 0);

				d3.selectAll('.legendItems')
					.style('pointer-events', 'none')
					.transition()
					.duration(1000)
					.delay(function(d,i){
						return (d3.selectAll('.legendItems').size() + 2 - i) * 100;})
					.style('opacity', 0);

				return;
			}

			let colors;

			if (dataMenu === true) {
				config.data[selectedData].diverging == true ? colors = colorsDiverging5 : colors = colors5;

				colorScheme
					.range(colors)
					.domain(config.data[selectedData].colorThresholds[selectedLayer]);

				//Legend colors, values and visibility
				d3.selectAll('.legendRect')
					.data(colors)
					.style('fill', (d,i) => colors[i]);

				let format = d3.format(config.data[selectedData].format);

				let legendValueAdjustment;
				config.data[selectedData].type == 'percent' ? legendValueAdjustment = 0.01 : legendValueAdjustment = 1;

				d3.select('#legendValue1')
					.text(`< ${format(config.data[selectedData].colorThresholds[selectedLayer][0])}`);
				d3.select('#legendValue2')
					.text(`${format(config.data[selectedData].colorThresholds[selectedLayer][0])} to ${format(config.data[selectedData].colorThresholds[selectedLayer][1] - legendValueAdjustment)}`);
				d3.select('#legendValue3')
					.text(`${format(config.data[selectedData].colorThresholds[selectedLayer][1])} to ${format(config.data[selectedData].colorThresholds[selectedLayer][2] - legendValueAdjustment)}`);
				d3.select('#legendValue4')
					.text(`${format(config.data[selectedData].colorThresholds[selectedLayer][2])} to ${format(config.data[selectedData].colorThresholds[selectedLayer][3] - legendValueAdjustment)}`);
				d3.select('#legendValue5')
					.text(`${format(config.data[selectedData].colorThresholds[selectedLayer][3])} +`);

				d3.select('#legendTitle')
					.text(config.data[selectedData].legendName);


				d3.selectAll('.legendItems')
					.style('pointer-events', 'auto')
					.transition()
					.duration(1000)
					.delay(function(d,i){return  300 + i * 100;})
					.style('opacity', 1);

				d3.select('#legendTitle')
					.transition()
					.duration(1000)
					.delay(500)
					.style('opacity', 1);

				d3.select('#legendBkgdRect')
					.style('pointer-events', 'auto')
					.transition()
					.duration(1000)
					.delay(500)
					.style('opacity', 0.75);

				//////// Assign a threshold group as class for paths in order to enable legend hover effect
				if (selectedLayer == 'SA') {
					d3.selectAll('.geo.serviceAreas')
						.attr('class', function(d) {
							return `geo serviceAreas dataLayer nonScaling group${colors.indexOf(colorScheme(d.properties[selectedData]))+1}`;
						});
				} else {
					d3.selectAll('.geo.states')
						.attr('class', function(d) {
							return `geo states dataLayer nonScaling group${colors.indexOf(colorScheme(d.properties[selectedData]))+1}`;
						});
				}


				///////// Tooltip viz xAxis domain

				let domainMax = -99999999,
						domainMin = 999999999;

				//MAX VALUE. Defaults to value defined in config; if not, calculate it.
				if (config.data[selectedData].domainMaxForTooltip != null) {
					domainMax = config.data[selectedData].domainMaxForTooltip
				} else {
					for (let sArea of data) {
						if (sArea.value[selectedData] > domainMax) {
							domainMax = sArea.value[selectedData];
						}
					}
				}

				//MIN VALUE. Defaults to value defined in config; if not, calculate it.
				if (config.data[selectedData].domainMinForTooltip != null) {
					domainMin = config.data[selectedData].domainMinForTooltip
				} else {
					for (let sArea of data) {
						if (sArea.value[selectedData] < domainMin) {
							domainMin = sArea.value[selectedData];
						}
					}
				}

				let extremes;
				if (config.data[selectedData].diverging == true) { //to center
					extremes = Math.max(Math.abs(domainMin),Math.abs(domainMax));
					tipXScale
						.rangeRound([0, tooltipWidth *0.7])
						.domain([-extremes, extremes]);
				} else {
					tipXScale
						.rangeRound([0, tooltipWidth * 0.7])
						.domain([domainMin, domainMax]); //to be re-calculated in updateDomain
				}
			}
		}


		function updateColors(smooth = false) {
			let tDuration = 0;
			smooth == true? tDuration = 500 : tDuration = 0;

			if (selectedData == 'none') {
				d3.selectAll('.geo.serviceAreas, .geo.states')
					.transition()
					.duration(tDuration)
					.style('fill', config.colors.mapDefault[mapStyle]);
				return;
			}

			if (selectedLayer == 'SA') {
				d3.selectAll('.geo.serviceAreas')
					.transition()
					.duration(tDuration)
					.style('fill', function(d) {
						return colorScheme(d.properties[selectedData]);
					})
			} else {
				d3.selectAll('.geo.states')
					.transition()
					.duration(tDuration)
					.style('fill', function(d) {
						return colorScheme(d.properties[selectedData]);
					})
			}

		}


		///////////////////////////////////////////////
		///////// Map mouseover/out functions /////////
		///////////////////////////////////////////////

		function mapMouseover(d, scope) {

			let selectedId, selectedClass;
			if (scope == 'ST') {
				selectedId = '#' + d.stAbbrev;
				selectedClass = '.states';
			} else if (scope == 'SA') {
				selectedId = '#' + d.properties.ServArea_1;
				selectedClass = '.serviceAreas'
			}


	  /*
	    //Set the selected area as last in the DOM (so effects like shadows are not hidden by other states that are rendered after). See https://stackoverflow.com/questions/37609569/d3-js-move-selected-element-to-the-end
	    //Note that this doesn't play well with css path :hover fill styling, so styling for this mouseovered path will be set here and reset in mouseout.
	    //Note this also seems to cause unwanted behavior in EDGE in which mouseover fires repeatedly, thus resetting the tooltips repeatedly which made it harder to get to them, sometimes causing the bar graphs to restart when hovering over the tooltip, and keeping hover highlight colors from clearing; perhaps this all has to do with this issue here https://stackoverflow.com/questions/39332279/anomalous-mouseover-handling-with-d3-js-in-internet-explorer-11


	    if (scope == 'ST') {
	      d3.select("#statesG").append(function() {
	        return d3.select(selectedId).remove().node();
	      });
	    } else if (scope == 'SA') {
	      d3.select("#serviceAreasG").append(function() {
	        return d3.select(selectedId).remove().node();
	      });
	    }
			*/
			//Styling
			d3.select(selectedId)
				.classed('hovered', true);

			if (combineGU === true) {
				if (selectedId == '#MP-1') { //For MP, Guam merger
					d3.select('#GU-1').classed('hovered', true);
				} else if (selectedId == '#MP') {
					d3.select('#GU').classed('hovered', true);
				}
			}


		}


		function mapMouseout(d, scope) {
			let selectedClass;
			if (scope == 'ST') {
				selectedClass = '.states';
			} else if (scope == 'SA') {
				selectedClass = '.serviceAreas'
			}

			d3.selectAll(selectedClass)
				.classed('hovered', false);
		}


		function cancelTooltips(){
			tipDisappearTimeout = setTimeout(function () {
				d3.selectAll('.tooltip')
					.style('display','none')
					.style('opacity', 0);
			}, disappearDelay);

			clearTimeout(tipAppearTimeout);
		}

		///////////////////////////////////////////
		///////// Tooltip update function /////////
		///////////////////////////////////////////

		function showTooltip(d, scope) {

			//Get relevant IDs
			let selectedId; //for the associated state or service area boundary
			if (scope == 'ST') {
				selectedId = '#' + d.stAbbrev;
			} else if (scope == 'SA') {
				selectedId = '#' + d.properties.ServArea_1;
			}

			let selectedTip;
			if (scope == 'ST') {
				selectedTip = d.stAbbrev + '-tip';
			} else if (scope == 'SA') {
				selectedTip = d.properties.ServArea_1 + '-tip';
			}

			const selectedTipId = '#' + selectedTip;
			const thisTip = d3.select(selectedTipId);

			//Draw data bars
			if (dataMenu === true) {
				if (selectedData != 'none') {

					thisTip.select('.tipGraphHeader')
						.html(config.data[selectedData].tooltipName);

					thisTip.select('.tipNationalLabel')
						.html(`National ${config.data[selectedData].nationalValueType == null ? '' : config.data[selectedData].nationalValueType}`);

					thisTip.selectAll('.tipDataDiv').style('display', 'block');

					if (selectedData == 'data_pctOfPopEligible') { //show as a footnote the number of people eligible (for % eligible)
						thisTip.select('.tipGraphFootnote')
							.style('display', 'block')
							.html('*' + d3.format(',')(d.properties.data_popEligible) + ' people');
						thisTip.select('.tipNationalLabel')
							.style('margin-bottom', 0);
					} else {
						thisTip.select('.tipGraphFootnote')
							.style('display', 'none');
						thisTip.select('.tipNationalLabel')
							.style('margin-bottom', 10 + 'px');
					}

					//let tipXAxis = thisTip.select('svg').append('g')
					//  .attr('transform', `translate(${tipXAxisFromLeft},${tipSvgHeight - 20})`)
					//  .call(d3.axisBottom(tipXScale));


					let dataBarColor = colorScheme(d.properties[selectedData]),
							dataBarWidth = Math.abs(tipXScale(0) - tipXScale(d.properties[selectedData])),
							nationalBarWidth = Math.abs(tipXScale(0) - tipXScale(config.data[selectedData].nationalValue[selectedLayer]));

					//first remove any previously generated graph items
					thisTip.selectAll('.tipGraphItems').remove();

					thisTip.select('svg')
						.append('rect')
						.attr('class', 'tipGraphBar1 tipGraphItems')
						.attr('width', 0)
						.attr('height', tipBarHeight)
						.style('fill', dataBarColor)
						.attr('transform', `translate(${tipXAxisFromLeft + tipXScale(0)}, 0)`);

					thisTip.select('svg')
						.append('rect')
						.attr('class', 'tipGraphBar2 tipGraphItems')
						.attr('width', 0)
						.attr('height', tipBarHeight)
						.style('fill', '#b4b4b4')
						.attr('transform', `translate(${tipXAxisFromLeft + tipXScale(0)}, ${tipBarGap + tipBarHeight})`);

					let asterisk;
					selectedData == 'data_pctOfPopEligible' ? asterisk = '*' : asterisk = '';

					thisTip.select('svg')
						.append('text')
		        .text(d3.format(config.data[selectedData].format)(d.properties[selectedData]) + asterisk)
						.attr('class', 'tipGraphValue1 tipGraphItems tipGraphValues')
						.style('fill', dataBarColor)
						.style('font-weight', 'bold');

					thisTip.select('svg')
						.append('text')
						.text(d3.format(config.data[selectedData].format)(config.data[selectedData].nationalValue[selectedLayer]))
						.attr('class', 'tipGraphValue2 tipGraphItems tipGraphValues')
						.style('fill', '#b4b4b4')
						.style('font-weight', 'bold');


					//Transition bars and values in
					thisTip.select('rect.tipGraphBar1')
						.transition()
						.delay(appearDelay)
						.duration(1500)
						.attr('width', dataBarWidth)
						.attr('transform', `translate(${d.properties[selectedData] < 0 ? tipXAxisFromLeft + tipXScale(0) - dataBarWidth : tipXAxisFromLeft + tipXScale(0)}, 0)`);

					thisTip.select('rect.tipGraphBar2')
						.transition()
						.delay(appearDelay)
						.duration(1500)
						.attr('width', nationalBarWidth)
						.attr('transform', `translate(${config.data[selectedData].nationalValue[selectedLayer] < 0 ? tipXAxisFromLeft + tipXScale(0) - nationalBarWidth : tipXAxisFromLeft + tipXScale(0)}, ${tipBarGap + tipBarHeight})`);

					thisTip.select('text.tipGraphValue1')
						.attr('transform', `translate(${tipXAxisFromLeft + tipXScale(0) + 5}, ${tipBarHeight * 0.7})`)
						.transition()
						.delay(appearDelay)
						.duration(1500)
						.attr('transform', `translate(${d.properties[selectedData] < 0 ? tipXAxisFromLeft + tipXScale(0) + 5 : tipXAxisFromLeft + tipXScale(0) + 5 + dataBarWidth}, ${tipBarHeight * 0.7})`);

					thisTip.select('text.tipGraphValue2')
						.attr('transform', `translate(${tipXAxisFromLeft + tipXScale(0) + 5}, ${tipBarGap + tipBarHeight * 1.7})`)
						.transition()
						.delay(appearDelay)
						.duration(1500)
						.attr('transform', `translate(${config.data[selectedData].nationalValue[selectedLayer] < 0 ? tipXAxisFromLeft + tipXScale(0) + 5 : tipXAxisFromLeft + tipXScale(0) + 5 + nationalBarWidth}, ${tipBarGap + tipBarHeight * 1.7})`);

				} else {
					thisTip.selectAll('.tipDataDiv').style('display', 'none');
				}
			} else {
				thisTip.selectAll('.tipDataDiv').style('display', 'none');
			}


			//FOR USING BOUNDING BOX TO POSITION TOOLTIP INSTEAD OF MOUSE POSITION
			//THIS IS NOT IDEAL FOR NEEDING TO GET MOUSE ONTO THE TOOLTIP, HOWEVER. IT CAN BE TOO FAR FOR PARTS OF ODD-SHAPED AREAS LIKE CA-31 OR MARYLAND TO GET THERE WITHOUT IT FIRST DISAPPEARING.

			//Get bounding box of the state or service area
			let bounds;
			selectedLayer == 'SA' ? bounds = path.bounds(d.geometry) : bounds = path.bounds(d); //[[left, top],[right, bottom]]
			const boundsHeight = bounds[1][1] - bounds[0][1];
			const distanceFromBounds = 5;


			//Delayed timeout for hiding tooltip
			tipDisappearTimeout = setTimeout(function () {
				d3.selectAll('.tooltip')
					.style('display','none')
					.style('opacity', 0);
			}, disappearDelay);

			//Delayed timeout for showing tooltip
			tipAppearTimeout = setTimeout(function () {
				thisTip
					.style('display','block');

				//Set tooltip position (to left or right depending on which side of the viz)
				let xPosition = mousePos[0];
				let yPosition = mousePos[1];

				if (xPosition < width/2) {
					thisTip.style("left", (xPosition + tooltipXOffset.right)+"px");
				} else {
					thisTip.style("left", (xPosition + tooltipXOffset.left)+"px");
				}

				/*FOR CALCULATING MOUSE POSITION AS D3 EVENT WHEN ENTERING THE AREA, NOT STORING AND UPDATING A GLOBAL MOUSEPOS VARIABLE
				//Set tooltip position (to left or right depending on which side of the viz)
				if (xPosition < width/2) {
					d3.select(selectedTipId)
						.style("top", (d3.event.pageY + tooltipYOffset)+"px")
						.style("left", (d3.event.pageX + tooltipXOffset.right)+"px");
				} else {
					d3.select(selectedTipId)
						.style("top", (d3.event.pageY + tooltipYOffset)+"px")
						.style("left", (d3.event.pageX + tooltipXOffset.left)+"px");
				}
				*/

				//calculate height of tooltip
				const tooltipHeight = thisTip.node().getBoundingClientRect().height;

				//vertical position tweaks for the mouse-based tooltip
				if (tooltipOnMouse === true) {
					if (yPosition < menuBarHeight + ((height - menuBarHeight)/3)) { //state or area is high on the canvas
						thisTip.style("top", `${yPosition + (tooltipHeight * 0.05)}px`);
					} else if (yPosition < menuBarHeight + ((height - menuBarHeight)/3) * 2) { //near center vertically on the canvas
						thisTip.style("top", `${yPosition - (tooltipHeight / 4)}px`);
					} else { //lower on the canvas
						thisTip.style("top", `${yPosition - (tooltipHeight * 0.8)}px`);
					}
				}

				//FOR USING BOUNDING BOX TO POSITION TOOLTIP INSTEAD OF MOUSE POSITION
				if (tooltipOnMouse === false) {
				//position the tooltip
					if (xPosition < width/2) { //left side
						thisTip.style("left", `${bounds[1][0] + distanceFromBounds}px`);
					} else { //right side
						thisTip.style("left", `${bounds[0][0] - distanceFromBounds - tooltipWidth}px`);
					}

					if (yPosition < menuBarHeight + ((height - menuBarHeight)/3)) { //state or area is high on the canvas
						thisTip.style("top", `${menuBarHeight + bounds[0][1] + (tooltipHeight * 0.1)}px`);
					} else if (yPosition < menuBarHeight + ((height - menuBarHeight)/3) * 2) { //near center vertically on the canvas
						thisTip.style("top", `${menuBarHeight + bounds[0][1] + (boundsHeight/2) - (tooltipHeight / 3)}px`);
					} else { //lower on the canvas
						thisTip.style("top", `${menuBarHeight + bounds[0][1] - (tooltipHeight * 0.8)}px`);
					}
				}

				//fade in
				thisTip
					.transition()
					.duration(appearFadeIn)
					.style('opacity', 1);

			}, appearDelay);

			//On tooltip hover, cancel timeouts and return to highlighting that area
			thisTip
				.on('mouseover', function(){
					//cancel all timeouts for new tooltips to appear or this one to disappear
					clearTimeout(tipAppearTimeout);
					clearTimeout(tipDisappearTimeout);

					//return the relevant state or service area to be highlighted/colored
					d3.select(selectedId)
						.classed('hovered', true);
				})
				.on('mouseout', function() {
					d3.selectAll('path')
						.classed('hovered', false);

					cancelTooltips();
				});

		}


		/////////////////////////////////////
		///////// CLEARING TOOLTIPS /////////
		/////////////////////////////////////

		function cancelTooltips() {
			//Hide any tooltips if mouse off map
			tipDisappearTimeout = setTimeout(function () {
				d3.selectAll('.tooltip')
					.style('display','none')
					.style('opacity', 0);
			}, disappearDelay);

			//Cancel any tooltips set to appear
			clearTimeout(tipAppearTimeout);
		}

		mapZoomRect.on('mouseover', function() { cancelTooltips(); });
		menuBarG.on('mouseover', function() { cancelTooltips(); });

		/////////////////////////////////
		///////// Zoom function /////////
		/////////////////////////////////

		function zoomed() {
			mapsG.selectAll('path')
				.attr('transform', d3.event.transform);

			mapsG.selectAll('rect')
				.attr('transform', d3.event.transform);

			//show zoom button
			resetG
				.style('pointer-events', 'auto')
				.transition()
				.duration(1000)
				.style('opacity', 1);

			//cancel any tooltip and ensure no tooltips or highlight colors are to be triggered
			cancelTooltips();
			mapsG.selectAll('path').style('pointer-events', 'none');
		}

		///////////////////////////////////////
		///////// Reset zoom function /////////
		///////////////////////////////////////

		function resetZoom() {
			mapZoomSensor.transition()
					.duration(750)
					.call( zoom.transform, d3.zoomIdentity );

			//Hide or cancel any tooltips
			tipDisappearTimeout = setTimeout(function () {
				d3.selectAll('.tooltip')
					.style('display','none')
					.style('opacity', 0);
			}, disappearDelay);

			clearTimeout(tipAppearTimeout);

			//clear any selection styling
			d3.select(selected)
				.classed('selected', false);


		}

		/////////////////////////////////////////////////////////
		/////////////////// Initial animation ///////////////////
		/////////////////////////////////////////////////////////
		function initialAnimation(areasJson) {
			svg.append('rect') //Rectangle to prevent any mouse events during transition in
				.attr('width', width)
				.attr('height', height)
				.attr('id', 'initOverlay')
				.style('opacity', 0)
				.style('z-index', 100)
				.transition()
				.delay(2100)
				.style('pointer-events', 'none');

			d3.select('#dataSelect')
				.style('pointer-events', 'none')
				.transition()
				.delay(2100)
				.style('pointer-events', 'auto');


			//Fade in version
			if (animateIn === 1) {
				d3.selectAll('.geo')
					.attr('opacity', 0);

				d3.selectAll('.geo')
					.transition()
					.duration(2000)
					.ease(d3.easeCubicInOut)
					.style('opacity', 1);

			}

			//Zoom in version
			if (animateIn === 2) {
				d3.selectAll('.geo')
					.attr('transform', 'translate(25,20)scale(0.90)');

				d3.selectAll('.geo')
					.transition()
					.duration(2000)
					.ease(d3.easeCubicInOut)
					.attr('transform', 'scale(1)');
			}

			//Experimental
			if (animateIn === 10) {
				d3.selectAll('.geo')
					.style('opacity', 0)
					.attr('transform', 'scale(0.6)rotate(-180)');

				d3.selectAll('.geo').transition()
					.delay(200)
					.duration(7000)
					.ease(d3.easeBounceOut)
					.style('opacity', 1)
					.attr('transform', 'scale(1)');
			}

			if (animateIn === 11) {
				d3.selectAll(`${saFirst === true ? '.serviceAreas' : '.states'}`).style('stroke-width', 100);

				d3.selectAll(`${saFirst === true ? '.serviceAreas' : '.states'}`).transition()
					.duration(3000)
					.ease(d3.easeCubicInOut)
					.style('stroke-width', 0.5);
			}



			//FOR AFTER THE ANIMATION IN
			const t = d3.timer(function() {

				t.stop();

				d3.selectAll('.territoryBox')
					.transition()
					.duration(1000)
					.style('stroke-opacity', 1);

				//Base layer as merge of all service areas -- for drop shadow
				d3.select('#baseG').append("path")
					.datum(topojson.merge(areasJson, areasJson.objects.service_areas.geometries))
					.attr("class", "baseLayer")
					.attr("d", path)
					.attr('class', 'basePath')
					.style("filter", "url(#drop-shadow)")
					.style('opacity', 0)
					.transition()
					.duration(1000)
					.style('opacity', 1);


				transitionInComplete = true;

			}, 2000);
		}
	}


	// Window resize listener
	var transitionInComplete = true; //If the initial zoom in animation is happening, don't allow resize redraw
	var mapDivWidth = document.getElementById("map").offsetWidth;
	var timeout;

	window.onresize = function(){
	  clearTimeout(timeout);
	  timeout = setTimeout(resizeRedraw, 200);
	};

	function resizeRedraw(){
		var mapDivWidthNew = document.getElementById("map").offsetWidth;
		if(mapDivWidthNew != mapDivWidth) {
			mapDivWidth = mapDivWidthNew;
			drawItOrNot();
		}
	}

	function drawItOrNot() {
		// Draw it!!
		if (document.getElementById("map").offsetWidth > 600 & transitionInComplete == true) {
			d3.select("#map").selectAll("*").remove();
			d3.select("#map").style('visibility', 'visible');
			transitionInComplete = false;

			drawServiceAreas(false, false, 1, false, 2, false, true, false, true); //(dataMenu, saFirst, animateIn, combineGU, mapStyle, linksOnTooltip, tooltipOnMouse, zoomOnClick, tooltipTitleOnly)

		//Or don't!!
		} else if (document.getElementById("map").offsetWidth <= 600) {
			d3.select("#map").selectAll("*").remove();
			d3.select("#map").style('visibility', 'hidden');
		}
	}

	drawItOrNot();
}());
