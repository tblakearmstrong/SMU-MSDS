const rowsPerPage = 5;
let currentPage = 1;
let data = [];
let totalPages = 1;

// Tooltip for all charts
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("z-index", "1000")
  .style("pointer-events", "none");

// Theme configuration
const themes = {
  dark: {
    background: "#1a1a1a",
    text: "#ffffff",
    accent: "#ffd700",
    chartBg: "#2a2a2a",
    border: "#333"
  },
  light: {
    background: "#ffffff",
    text: "#333333",
    accent: "#0066cc",
    chartBg: "#f5f5f5",
    border: "#ddd"
  },
  cinema: {
    background: "#000000",
    text: "#ffffff",
    accent: "#ff0000",
    chartBg: "#1a1a1a",
    border: "#333"
  },
  modern: {
    background: "#2c3e50",
    text: "#ecf0f1",
    accent: "#3498db",
    chartBg: "#34495e",
    border: "#2c3e50"
  }
};

// Load the local CSV file
d3.csv("MovieDataClean.csv").then(loadedData => {
  data = loadedData;
  totalPages = Math.ceil(data.length / rowsPerPage);
  
  updateSlider();
  renderTable();
  createVisualizations();
}).catch(error => {
  console.error("Error loading data:", error);
});

function updateSlider() {
  const slider = d3.select("#page-slider");
  slider.attr("max", totalPages);
  slider.on("input", function() {
    currentPage = +this.value;
    renderTable();
  });
}

function renderTable() {
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = data.slice(start, end);

  const container = d3.select("#table-container");
  const table = container.select("table");
  const thead = table.select("thead");
  const tbody = table.select("tbody");

  // Clear previous content
  thead.html("");
  tbody.html("");

  if (pageData.length === 0) {
    tbody.append("tr")
      .append("td")
      .attr("colspan", Object.keys(pageData[0]).length)
      .text("No data available.");
    return;
  }

  // Table headers
  thead.append("tr")
    .selectAll("th")
    .data(Object.keys(pageData[0]))
    .enter()
    .append("th")
    .text(d => d)
    .style("text-transform", "capitalize");

  // Table rows
  const rows = tbody.selectAll("tr")
    .data(pageData)
    .enter()
    .append("tr");

  rows.selectAll("td")
    .data(d => Object.values(d))
    .enter()
    .append("td")
    .text(d => {
      // Format numbers with commas
      if (!isNaN(d) && d !== "") {
        return Number(d).toLocaleString();
      }
      return d;
    });

  // Update pagination text and slider
  d3.select("#page-info").text(`Page ${currentPage} of ${totalPages}`);
  d3.select("#page-slider").property("value", currentPage);

  // Update button states
  d3.select("#prev").property("disabled", currentPage === 1);
  d3.select("#next").property("disabled", currentPage === totalPages);
}

function createVisualizations() {
  createActorsChart();
  createParallelPlot();
  createGenreAnalysis();
  createFinancialParallelPlot();
}

function createActorsChart() {
  const count = +d3.select("#actor-count").node().value;
  
  const container = d3.select("#actors-chart");
  const containerWidth = container.node().getBoundingClientRect().width;
  const containerHeight = container.node().getBoundingClientRect().height;
  
  const margin = {top: 20, right: 30, bottom: 40, left: 150};
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;

  // Clear previous chart
  container.html("");

  // Process actor data
  const actorCounts = {};
  data.forEach(movie => {
    if (movie.cast && movie.cast !== "N/A") {
      const actors = movie.cast.split(",")
        .map(actor => actor.trim())
        .filter(actor => actor && actor !== "N/A" && actor !== "");
      
      const uniqueActors = [...new Set(actors)];
      
      uniqueActors.forEach(actor => {
        actorCounts[actor] = (actorCounts[actor] || 0) + 1;
      });
    }
  });

  // Sort actors by count and take top N
  const topActors = Object.entries(actorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);

  // Create SVG
  const svg = container.append("svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(topActors, d => d[1])])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(topActors.map(d => d[0]))
    .range([0, height])
    .padding(0.1);

  // Add Y axis
  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "12px")
    .style("fill", "#ffffff");

  // Add X axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("fill", "#ffffff");

  // Add axis lines
  svg.selectAll(".domain, .tick line")
    .style("stroke", "#ffffff");

  // Add bars
  svg.selectAll(".bar")
    .data(topActors)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("y", d => y(d[0]))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", d => x(d[1]))
    .style("fill", "#ffd700")
    .on("mouseover", function(event, d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`${d[0]}<br/>Movies: ${d[1]}`)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });
}

// Add event listener for actor count selector
d3.select("#actor-count").on("change", function() {
  createActorsChart();
});

// Add event listener for movie count selector
d3.select("#movie-count").on("change", function() {
  createParallelPlot();
  createFinancialParallelPlot(d3.select("#financial-chart"));
});

// Common chart creation function
function createChart(containerId, data, dimensions, title) {
  const container = d3.select(containerId);
  container.html(""); // Clear previous content
  
  const containerWidth = container.node().getBoundingClientRect().width;
  const containerHeight = container.node().getBoundingClientRect().height;
  const margin = {top: 20, right: 30, bottom: 40, left: 200};
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;
  
  const svg = container.append("svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
    
  // Add title if provided
  if (title) {
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .text(title);
  }
  
  return { svg, width, height, margin };
}

// Modified createParallelPlot function
function createParallelPlot() {
 
  const container = d3.select("#directors-chart");
  const containerWidth = container.node().getBoundingClientRect().width;
  const containerHeight = container.node().getBoundingClientRect().height;
  
  const margin = {top: 20, right: 30, bottom: 40, left: 200};
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;

  // Clear previous chart
  container.html("");

  // Get the number of movies to plot from the input
  const movieCount = +d3.select("#movie-count").node().value;

  // Filter data to only include movies with budget, revenue, and rating
  const selectedData = data.filter(movie => 
    movie.budget > 0 && 
    movie.revenue > 0 && 
    movie.vote_average > 0
  ).slice(0, movieCount); 

  // Process data for parallel plot
  const dimensions = [
    {
      name: "Budget (Millions)",
      scale: d3.scaleLinear()
        .domain([0, d3.max(selectedData, d => +d.budget / 1000000)])
        .range([height, 0])
    },
    {
      name: "Runtime (Minutes)",
      scale: d3.scaleLinear()
        .domain([0, d3.max(selectedData, d => +d.runtime)])
        .range([height, 0])
    },
    {
      name: "Rating",
      scale: d3.scaleLinear()
        .domain([0, 10])
        .range([height, 0])
    }
  ];

  // Create SVG
  const svg = container.append("svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add axes
  const x = d3.scalePoint()
    .domain(dimensions.map(d => d.name))
    .range([0, width]);

  // Add axis lines
  svg.selectAll(".axis")
    .data(dimensions)
    .enter()
    .append("g")
    .attr("class", "axis")
    .attr("transform", d => `translate(${x(d.name)})`)
    .each(function(d) {
      d3.select(this).call(d3.axisLeft(d.scale));
    });

  // Add axis labels
  svg.selectAll(".axis-label")
    .data(dimensions)
    .enter()
    .append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("x", d => x(d.name))
    .attr("y", -6)
    .text(d => d.name)
    .style("fill", "#ffffff");

  // Add lines for each movie
  const line = d3.line()
    .defined(d => !isNaN(d.value))
    .x(d => x(d.name))
    .y(d => d.scale(d.value));

  const lines = svg.selectAll(".line")
    .data(selectedData)
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("d", d => {
      const points = dimensions.map(dim => ({
        name: dim.name,
        scale: dim.scale,
        value: dim.name === "Budget (Millions)" ? +d.budget / 1000000 :
               dim.name === "Rating" ? +d.vote_average :
               +d.runtime
      }));
      return line(points);
    })
    .style("fill", "none")
    .style("stroke", "#ffd700")
    .style("stroke-opacity", 0.1)
    .on("mouseover", function(event, d) {
      d3.select(this)
        .style("stroke-opacity", 1)
        .style("stroke-width", 2);
      
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      
      tooltip.html(`
        <div class="movie-tooltip">
          <h3>${d.title}</h3>
          <div class="movie-metrics">
            <div class="metric">
              <div class="metric-label">Budget</div>
              <div class="metric-value">$${(+d.budget / 1000000).toFixed(1)}M</div>
            </div>
            <div class="metric">
              <div class="metric-label">Runtime</div>
              <div class="metric-value">${d.runtime} minutes</div>
            </div>
            <div class="metric">
              <div class="metric-label">Rating</div>
              <div class="metric-value">${d.vote_average}/10</div>
            </div>
          </div>
        </div>
      `)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .style("stroke-opacity", 0.1)
        .style("stroke-width", 1);
      
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });

  // Style the axes
  svg.selectAll(".axis text")
    .style("fill", "#ffffff");

  svg.selectAll(".axis line, .axis path")
    .style("stroke", "#ffffff");
}

function createDirectorDrillDown(director, yearsData) {
  const margin = {top: 20, right: 30, bottom: 40, left: 60};
  const containerWidth = container.node().getBoundingClientRect().width;
  const width = containerWidth - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Clear previous drill-down chart
  d3.select("#directors-chart").html("");

  // Sort years in ascending order
  const sortedYears = Object.entries(yearsData)
    .sort((a, b) => a[0] - b[0]);

  // Create SVG
  const svg = d3.select("#directors-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create scales
  const x = d3.scaleBand()
    .domain(sortedYears.map(d => d[0]))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, 10]) // Ratings are from 0 to 10
    .range([height, 0]);

  // Add X axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("fill", "#ffffff")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  // Add Y axis with rating formatting
  svg.append("g")
    .call(d3.axisLeft(y).tickFormat(d => d.toFixed(1)))
    .selectAll("text")
    .style("fill", "#ffffff");

  // Add axis lines
  svg.selectAll(".domain, .tick line")
    .style("stroke", "#ffffff");

  // Add bars
  svg.selectAll(".bar")
    .data(sortedYears)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1].averageRating))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d[1].averageRating))
    .style("fill", "#ffd700")
    .on("mouseover", function(event, d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      
      tooltip.html(`
        <strong>${director}</strong><br/>
        Year: ${d[0]}<br/>
        Average Rating: ${d[1].averageRating.toFixed(1)}<br/>
        Movies: ${d[1].count}
      `)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });

  // Add back button
  const backButton = svg.append("g")
    .attr("class", "back-button")
    .attr("transform", `translate(${width - 100}, -10)`)
    .style("cursor", "pointer");

  backButton.append("rect")
    .attr("width", 100)
    .attr("height", 30)
    .attr("rx", 5)
    .style("fill", "#ffd700");

  backButton.append("text")
    .attr("x", 50)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("fill", "#000000")
    .text("Back to Directors");

  backButton.on("click", function() {
    createParallelPlot();
  });

  // Add chart title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 0 - (margin.top / 2))
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#ffffff")
    .text(`${director} - Average Rating by Year`);
}

function createGenreAnalysis() {
  // Clear previous content
  d3.select("#genre-chart").html("");
  d3.select("#financial-chart").html("");

  // Create containers for each chart
  const genreContainer = d3.select("#genre-chart")
    .classed("viz-container", true);
  
  const financialContainer = d3.select("#financial-chart")
    .classed("viz-container", true);

  // Add titles to each container
  genreContainer.append("h2").text("Genre Analysis");
  financialContainer.append("h2").text("Financial Metrics");

  // Add metric selector for genre analysis
  const metricSelector = genreContainer.append("div")
    .attr("class", "metric-selector")
    .style("margin-bottom", "10px");

  metricSelector.append("label")
    .attr("for", "genre-select")
    .text("Select Metric: ");

  metricSelector.append("select")
    .attr("id", "genre-select")
    .selectAll("option")
    .data([
      { value: "rating", text: "Rating" },
      { value: "budget", text: "Budget" },
      { value: "revenue", text: "Revenue" }
    ])
    .enter()
    .append("option")
    .attr("value", d => d.value)
    .text(d => d.text);

  // Create both charts with adjusted dimensions
  createGenreChart(genreContainer);
  createFinancialParallelPlot(financialContainer);

  // Add event listener for genre metric selector
  d3.select("#genre-select").on("change", function() {
    createGenreChart(genreContainer);
  });
}

function createFinancialParallelPlot(container) {
  const margin = {top: 20, right: 30, bottom: 40, left: 200};
  const containerWidth = container.node().getBoundingClientRect().width;
  const containerHeight = container.node().getBoundingClientRect().height;
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;

  // Clear previous chart
  container.html("");

  // Get the number of movies to plot from the input
  const movieCount = +d3.select("#movie-count").node().value;

  // Filter data to only include movies with budget and revenue
  const financialData = data.filter(movie => 
    movie.budget > 0 && 
    movie.revenue > 0 && 
    movie.vote_average > 0
  ).slice(0, movieCount); 

  // Get the maximum values from the current dataset
  const maxBudget = d3.max(financialData, d => d.budget / 1000000);
  const maxRevenue = d3.max(financialData, d => d.revenue / 1000000);

  // Create SVG
  const svg = container.append("svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Define dimensions with scales based on current dataset
  const dimensions = [
    {
      name: "Budget (Millions)",
      scale: d3.scaleLinear()
        .domain([0, maxBudget])
        .range([height, 0])
    },
    {
      name: "Revenue (Millions)",
      scale: d3.scaleLinear()
        .domain([0, maxRevenue])
        .range([height, 0])
    },
    {
      name: "Rating",
      scale: d3.scaleLinear()
        .domain([0, 10])
        .range([height, 0])
    }
  ];

  // Create axes with proper padding
  const x = d3.scalePoint()
    .domain(dimensions.map(d => d.name))
    .range([0, width]);

  // Add axis lines
  svg.selectAll(".axis")
    .data(dimensions)
    .enter()
    .append("g")
    .attr("class", "axis")
    .attr("transform", d => `translate(${x(d.name)})`)
    .each(function(d) {
      d3.select(this).call(d3.axisLeft(d.scale));
    });

  // Add axis labels
  svg.selectAll(".axis-label")
    .data(dimensions)
    .enter()
    .append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("x", d => x(d.name))
    .attr("y", -6)
    .text(d => d.name)
    .style("fill", "#ffffff");

  // Create line generator
  const line = d3.line()
    .defined(d => !isNaN(d.value))
    .x(d => x(d.name))
    .y(d => {
      // Ensure y values stay within the plot bounds
      const yValue = d.scale(d.value);
      return Math.max(0, Math.min(height, yValue));
    });

  // Add lines for each movie
  const lines = svg.selectAll(".line")
    .data(financialData)
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("d", d => {
      const points = dimensions.map(dim => ({
        name: dim.name,
        scale: dim.scale,
        value: dim.name.includes("Budget") ? d.budget / 1000000 :
               dim.name.includes("Revenue") ? d.revenue / 1000000 :
               d.vote_average
      }));
      return line(points);
    })
    .style("fill", "none")
    .style("stroke", d => {
      // Color lines based on profitability
      const profit = d.revenue - d.budget;
      return profit > 0 ? "#00ff00" : "#ff0000"; 
    })
    .style("stroke-opacity", 0.1)
    .style("stroke-width", 1)
    .on("mouseover", function(event, d) {
      d3.select(this)
        .style("stroke-opacity", 1)
        .style("stroke-width", 2);
      
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      
      const profit = d.revenue - d.budget;
      const profitMargin = (profit / d.budget) * 100;
      
      tooltip.html(`
        <div class="movie-tooltip">
          <h3>${d.title}</h3>
          <div class="movie-metrics">
            <div class="metric">
              <div class="metric-label">Budget</div>
              <div class="metric-value">$${(d.budget / 1000000).toFixed(1)}M</div>
            </div>
            <div class="metric">
              <div class="metric-label">Revenue</div>
              <div class="metric-value">$${(d.revenue / 1000000).toFixed(1)}M</div>
            </div>
            <div class="metric">
              <div class="metric-label">Profit</div>
              <div class="metric-value" style="color: ${profit > 0 ? '#00ff00' : '#ff0000'}">
                $${(profit / 1000000).toFixed(1)}M (${profitMargin.toFixed(1)}%)
              </div>
            </div>
            <div class="metric">
              <div class="metric-label">Rating</div>
              <div class="metric-value">${d.vote_average.toFixed(1)}/10</div>
            </div>
          </div>
        </div>
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .style("stroke-opacity", 0.1)
        .style("stroke-width", 1);
      
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });

  // Style the axes
  svg.selectAll(".axis text")
    .style("fill", "#ffffff");

  svg.selectAll(".axis line, .axis path")
    .style("stroke", "#ffffff");
}

function createGenreChart(container) {
  const margin = {top: 20, right: 30, bottom: 40, left: 60};
  const containerWidth = container.node().getBoundingClientRect().width;
  const width = containerWidth - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Clear previous chart
  container.html("");

  // Get the number of movies to plot from the input
  const movieCount = +d3.select("#movie-count").node().value;
  
  // Get the selected metric from the dropdown
  const selectedMetric = d3.select("#genre-select").node().value;

  // Filter data to only include movies with valid values
  const validData = data.filter(movie => 
    movie.budget > 0 && 
    movie.revenue > 0 && 
    movie.vote_average > 0 &&
    movie.genres && 
    movie.genres !== "N/A"
  ).slice(0, movieCount);

  // Process genre data
  const genreData = {};
  validData.forEach(movie => {
    const genres = movie.genres.split(",").map(g => g.trim());
    genres.forEach(genre => {
      if (!genreData[genre]) {
        genreData[genre] = {
          values: [],
          movies: [],
          years: {}
        };
      }
      
      // Use the selected metric
      let value;
      switch(selectedMetric) {
        case 'rating':
          value = +movie.vote_average;
          break;
        case 'budget':
          value = +movie.budget / 1000000; // Convert to millions
          break;
        case 'revenue':
          value = +movie.revenue / 1000000; // Convert to millions
          break;
      }
      
      if (!isNaN(value) && value > 0) {
        genreData[genre].values.push(value);
        genreData[genre].movies.push({
          title: movie.title,
          rating: +movie.vote_average,
          budget: +movie.budget,
          revenue: +movie.revenue
        });
      }
    });
  });

  // Calculate box plot statistics for each genre
  const boxPlotData = Object.entries(genreData).map(([genre, data]) => {
    const values = data.values.sort((a, b) => a - b);
    const q1 = d3.quantile(values, 0.25);
    const median = d3.quantile(values, 0.5);
    const q3 = d3.quantile(values, 0.75);
    const iqr = q3 - q1;
    const min = Math.max(values[0], q1 - 1.5 * iqr);
    const max = Math.min(values[values.length - 1], q3 + 1.5 * iqr);

    return {
      genre,
      min,
      q1,
      median,
      q3,
      max,
      values: data.values,
      movies: data.movies
    };
  });

  // Create SVG
  const svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create scales
  const x = d3.scaleBand()
    .domain(boxPlotData.map(d => d.genre))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(boxPlotData, d => d.max) * 1.1])
    .range([height, 0]);

  // Add X axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("fill", "#ffffff")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  // Add Y axis
  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "#ffffff");

  // Add Y axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("fill", "#ffffff")
    .text(selectedMetric === 'rating' ? 'Rating' : 
          selectedMetric === 'budget' ? 'Budget (Millions)' : 
          'Revenue (Millions)');

  // Draw box plots
  boxPlotData.forEach(d => {
    const xPos = x(d.genre);
    const boxWidth = x.bandwidth();

    // Create a group for the box plot elements
    const boxGroup = svg.append("g")
      .attr("class", "box-plot")
      .on("mouseover", function(event) {
        d3.select(this).selectAll("rect, line")
          .style("opacity", 0.8);
        
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        
        const tooltipContent = `
          <div class="genre-tooltip">
            <h3>${d.genre}</h3>
            <div class="metrics-grid">
              <div class="metric">
                <div class="metric-value">${d.values.length}</div>
                <div class="metric-label">Movies</div>
              </div>
              <div class="metric">
                <div class="metric-value">${d.median.toFixed(1)}</div>
                <div class="metric-label">Median</div>
              </div>
              <div class="metric">
                <div class="metric-value">${d.q1.toFixed(1)} - ${d.q3.toFixed(1)}</div>
                <div class="metric-label">IQR</div>
              </div>
            </div>
            <div class="top-movies">
              <h4>Top Rated Movies</h4>
              <ul>
                ${d.movies
                  .sort((a, b) => b.rating - a.rating)
                  .slice(0, 3)
                  .map(m => `<li>${m.title} (${m.rating.toFixed(1)})</li>`)
                  .join("")}
              </ul>
            </div>
          </div>
        `;
        
        tooltip.html(tooltipContent)
          .style("left", (event.pageX) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).selectAll("rect, line")
          .style("opacity", 1);
        
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Draw main box
    boxGroup.append("rect")
      .attr("x", xPos)
      .attr("y", y(d.q3))
      .attr("width", boxWidth)
      .attr("height", y(d.q1) - y(d.q3))
      .attr("fill", "#ffd700")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1);

    // Draw median line
    boxGroup.append("line")
      .attr("x1", xPos)
      .attr("x2", xPos + boxWidth)
      .attr("y1", y(d.median))
      .attr("y2", y(d.median))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);

    // Draw whiskers
    boxGroup.append("line")
      .attr("x1", xPos + boxWidth / 2)
      .attr("x2", xPos + boxWidth / 2)
      .attr("y1", y(d.max))
      .attr("y2", y(d.min))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1);

    // Draw min and max lines
    boxGroup.append("line")
      .attr("x1", xPos)
      .attr("x2", xPos + boxWidth)
      .attr("y1", y(d.max))
      .attr("y2", y(d.max))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1);

    boxGroup.append("line")
      .attr("x1", xPos)
      .attr("x2", xPos + boxWidth)
      .attr("y1", y(d.min))
      .attr("y2", y(d.min))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1);
  });
}

// Helper function to create trend chart
function createTrendChart(yearsData) {
  const years = Object.keys(yearsData).sort();
  const values = years.map(year => yearsData[year]);
  
  const margin = {top: 5, right: 5, bottom: 20, left: 5};
  const width = 200 - margin.left - margin.right;
  const height = 100 - margin.top - margin.bottom;
  
  const x = d3.scaleBand()
    .domain(years)
    .range([0, width])
    .padding(0.1);
    
  const y = d3.scaleLinear()
    .domain([0, d3.max(values)])
    .range([height, 0]);
    
  const line = d3.line()
    .x((d, i) => x(years[i]) + x.bandwidth() / 2)
    .y(d => y(d));
    
  return `
    <g transform="translate(${margin.left},${margin.top})">
      <path d="${line(values)}" fill="none" stroke="#ffd700" stroke-width="2"/>
      ${values.map((d, i) => `
        <circle cx="${x(years[i]) + x.bandwidth() / 2}" cy="${y(d)}" r="3" fill="#ffd700"/>
      `).join("")}
    </g>
  `;
}

// Button events
d3.select("#prev").on("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

d3.select("#next").on("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
});

// Apply theme
function applyTheme(themeName) {
  const theme = themes[themeName];
  
  // Set CSS variables for theme colors
  document.documentElement.style.setProperty('--background', theme.background);
  document.documentElement.style.setProperty('--text', theme.text);
  document.documentElement.style.setProperty('--accent', theme.accent);
  document.documentElement.style.setProperty('--chartBg', theme.chartBg);
  document.documentElement.style.setProperty('--border', theme.border);
  
  // Update body and text colors
  document.body.style.backgroundColor = theme.background;
  document.body.style.color = theme.text;
  
  // Update containers and borders
  d3.selectAll(".viz-container")
    .style("background-color", theme.chartBg)
    .style("border-color", theme.border);
    
  // Update headings
  d3.selectAll("h1, h2")
    .style("color", theme.accent);
    
  // Update controls
  d3.selectAll(".controls select, .controls input")
    .style("border-color", theme.accent)
    .style("color", theme.text)
    .style("background-color", theme.background);
    
  // Update theme selector
  d3.selectAll(".theme-selector")
    .style("background-color", theme.chartBg)
    .style("border-color", theme.accent);
    
  d3.selectAll(".theme-selector select")
    .style("background-color", theme.background)
    .style("color", theme.text)
    .style("border-color", theme.accent);

  // Update chart elements
  d3.selectAll(".bar")
    .style("fill", theme.accent);

  d3.selectAll(".axis text")
    .style("fill", theme.text);

  d3.selectAll(".axis path, .axis line")
    .style("stroke", theme.text);

  d3.selectAll(".tooltip")
    .style("background-color", theme.chartBg)
    .style("color", theme.text)
    .style("border-color", theme.accent);

  createVisualizations();
}
// Theme selector event listener
d3.select("#theme-select").on("change", function() {
  applyTheme(this.value);
});

// Initialize with dark theme
applyTheme("dark");