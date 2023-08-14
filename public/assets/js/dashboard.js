$(function() {
  'use strict'

  var gridLineColor = 'rgba(77, 138, 240, .1)';

  var colors = {
    primary:         "#63D2FF",
    secondary:       "#7987a1",
    success:         "#42b72a",
    info:            "#68afff",
    warning:         "#fbbc06",
    danger:          "#ff3366",
    light:           "#ececec",
    dark:            "#282f3a",
    muted:           "#686868"
  }

  var flotChart1Data = [
    [0,20000.331065063219285],
    [1,33000.79814898366035],
    
    
  ];

  // Dashbaord date start
  if($('#dashboardDate').length) {
    var date = new Date();
    var today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    $('#dashboardDate').datepicker({
      format: "dd-MM-yyyy",
      todayHighlight: true,
      autoclose: true
    });
    $('#dashboardDate').datepicker('setDate', today);
  }
  // Dashbaord date end

  // Flot chart1 start
  if($('#flotChart1').length) {
    $.plot('#flotChart1', [{
      data: flotChart1Data,
      color: '#727cf5'
      }], {
      series: {
        shadowSize: 0,
        lines: {
          show: true,
          lineWidth: 2,
          fill: true,
          fillColor: 'transparent'
        }
      },
      grid: {
        borderColor: 'transparent',
        borderWidth: 1,
        labelMargin: 0,
        aboveData: false
      },
      yaxis: {
        show: true,
        color: 'rgba(0,0,0,0.06)',
        ticks: [[0, ''], [15, '$8400k'], [30, '$8500k'], [45, '$8600k'], [60, '$8700k'], [75, '$8800k']],
        tickColor: gridLineColor,
        min: 0,
        max: 80,
        font: {
          size: 11,
          weight: '600',
          color: colors.muted,
          min: 1000,
          max: 80000,
        }
      },
      xaxis: {
        show: true,
        color: 'rgba(0,0,0,0.1)',
        ticks: [[0, 'Jan'], [20, 'Feb'], [40, 'Mar'], [60, 'Apr'], [80, 'May'], [100, 'June'], [120, 'July'], [140, 'Aug']],
        tickColor: gridLineColor,      
        font: {
          size: 13,
          color: colors.muted
        },
        reserveSpace: false
      }
    });
  }
  // Flot chart1 end

  // Apex chart1 start
  if($('#apexChart1').length) {
    var options1 = {
      chart: {
        type: "line",
        height: 60,
        sparkline: {
          enabled: !0
        }
      },
      series: [{
          data: [3844, 3855, 3841, 3867, 3822, 3843, 3821, 3841, 3856, 3827, 3843]
      }],
      stroke: {
        width: 2,
        curve: "smooth"
      },
      markers: {
        size: 0
      },
      colors: ["#727cf5"],
      tooltip: {
        fixed: {
          enabled: !1
        },
        x: {
          show: !1
        },
        y: {
          title: {
            formatter: function(e) {
              return ""
            }
          }
        },
        marker: {
          show: !1
        }
      }
    };
    new ApexCharts(document.querySelector("#apexChart1"),options1).render();
  }
  // Apex chart1 end

  // Apex chart2 start
  if($('#apexChart2').length) {
    var options2 = {
      chart: {
        type: "bar",
        height: 60,
        sparkline: {
          enabled: !0
        }
      },
      plotOptions: {
        bar: {
          columnWidth: "60%"
        }
      },
      colors: ["#727cf5"],
      series: [{
        data: [36, 77, 52, 90, 74, 35, 55, 23, 47, 10, 63]
      }],
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      xaxis: {
        crosshairs: {
          width: 1
        }
      },
      tooltip: {
        fixed: {
          enabled: !1
        },
        x: {
          show: !1
        },
        y: {
          title: {
            formatter: function(e) {
              return ""
            }
          }
        },
        marker: {
          show: !1
        }
      }
    };
    new ApexCharts(document.querySelector("#apexChart2"),options2).render();
  }
  // Apex chart2 end

  // Apex chart3 start
  if($('#apexChart3').length) {
    var options3 = {
      chart: {
        type: "line",
        height: 60,
        sparkline: {
          enabled: !0
        }
      },
      series: [{
          data: [41, 45, 44, 46, 52, 54, 43, 74, 82, 82, 89]
      }],
      stroke: {
        width: 2,
        curve: "smooth"
      },
      markers: {
        size: 0
      },
      colors: ["#727cf5"],
      tooltip: {
        fixed: {
          enabled: !1
        },
        x: {
          show: !1
        },
        y: {
          title: {
            formatter: function(e) {
              return ""
            }
          }
        },
        marker: {
          show: !1
        }
      }
    };
    new ApexCharts(document.querySelector("#apexChart3"),options3).render();
  }
  // Apex chart3 end

  // Progressgar1 start
  if($('#progressbar1').length) {
    var bar = new ProgressBar.Circle(progressbar1, {
      color: colors.primary,
      trailColor: gridLineColor,
      // This has to be the same size as the maximum width to
      // prevent clipping
      strokeWidth: 4,
      trailWidth: 1,
      easing: 'easeInOut',
      duration: 1400,
      text: {
        autoStyleContainer: false
      },
      from: { color: colors.primary, width: 1 },
      to: { color: colors.primary, width: 4 },
      // Set default step function for all animate calls
      step: function(state, circle) {
        circle.path.setAttribute('stroke', state.color);
        circle.path.setAttribute('stroke-width', state.width);
    
        var value = Math.round(circle.value() * 100);
        if (value === 0) {
          circle.setText('');
        } else {
          circle.setText(value + '%');
        }
    
      }
    });
    bar.text.style.fontFamily = "'Overpass', sans-serif;";
    bar.text.style.fontSize = '3rem';
    
    bar.animate(.78);
  }
  

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

 // Fetch function to get data from the API
const fetchData = () => {
  fetch('https://m-kel-tech-tracker.onrender.com/management-summary')
    .then(response => response.json())
    .then(data => {
      // Process the data received from the API
      console.log('Your data', data);

      // Process the data to get the labels and values for the chart
      let labels = [];
      let values = [];

      data.forEach(p => {
        labels.push(p.carrier);
        values.push(p.minutes);
      });

      console.log('LABELS: ', labels);
      console.log('VALUES: ', values);

      // Create the chart using the retrieved data
      if ($('#monthly-sales-chart').length) {
        var monthlySalesChart = document.getElementById('monthly-sales-chart').getContext('2d');
        new Chart(monthlySalesChart, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Minutes',
              data: values,
              backgroundColor: colors.primary,
            }],
          },
          options: {
            maintainAspectRatio: false,
            legend: {
              display: false,
              labels: {
                display: false,
              },
            },
            scales: {
              xAxes: [{
                display: true,
                barPercentage: .3,
                categoryPercentage: .6,
                gridLines: {
                  display: false,
                },
                ticks: {
                  fontColor: '#8392a5',
                  fontSize: 10,
                },
              }],
              yAxes: [{
                gridLines: {
                  color: gridLineColor,
                },
                ticks: {
                  fontColor: '#8392a5',
                  fontSize: 10,
                  min: 1000,
                  max: 80000,
                },
              }],
            },
          },
        });
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
};

// Call the fetch function to get the data and display the chart
fetchData();



  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


  // Monthly flot chart 

  if ($('#flotChartVoip').length) {
    fetch('http://www.localhost:3000/carrier-stats') // Replace with your actual API endpoint
      .then(response => response.json())
      .then(data => {
        const flotChart1Data = data.map(entry => [entry.month, entry.totalMinutes]);
        console.log('This is your monthly DAta: ',flotChart1Data)
        $.plot('#flotChart1', [{
          data: flotChart1Data,
          color: '#727cf5'
        }], {
          series: {
            shadowSize: 0,
            lines: {
              show: true,
              lineWidth: 2,
              fill: true,
              fillColor: 'transparent'
            }
          },
          grid: {
            borderColor: 'transparent',
            borderWidth: 1,
            labelMargin: 0,
            aboveData: false
          },
          yaxis: {
            show: true,
            color: 'rgba(0,0,0,0.06)',
            ticks: [[0, ''], [10, '10000'], [20, '20000'], [30, '30000'], [40, '40000'], [50, '50000']],
            tickColor: gridLineColor,
            min: 0,
            max: 80,
            font: {
              size: 11,
              weight: '600',
              color: colors.muted
            }
          },
          xaxis: {
            show: true,
            color: 'rgba(0,0,0,0.1)',
            ticks: data.map(entry => [entry.month, entry.year]),
            tickColor: gridLineColor,      
            font: {
              size: 13,
              color: colors.muted
            },
            reserveSpace: false
          }
        });
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }

  // Working data ************************************************
  // let flotData = []
  // if ($('#flotChart1').length) {
  //   fetch('http://www.localhost:3000/monthly-summary') // Replace with your actual API endpoint
  //     .then(response => response.json())
  //     .then(data => {
  //       const flotChart1Data = data.map((entry, index) => [index, entry.totalMinutes]);
  //       flotData.push(flotChart1Data)
  //       console.log('This is your monthly DAta: ',data)
  //       console.log('This is your monthly DAta in flotCHart Format: ',flotData)
        
  //       $.plot('#flotChart1', [{
  //         data: flotChart2Data,
  //         color: '#727cf5'
  //       }], {
  //         series: {
  //           shadowSize: 0,
  //           lines: {
  //             show: true,
  //             lineWidth: 2,
  //             fill: true,
  //             fillColor: 'transparent'
  //           }
  //         },
  //         grid: {
  //           borderColor: 'transparent',
  //           borderWidth: 1,
  //           labelMargin: 0,
  //           aboveData: false
  //         },
  //         yaxis: {
  //           show: true,
  //           color: 'rgba(0,0,0,0.06)',
  //           ticks: [[0, ''], [20, '10000'], [40, '20000'], [60, '30000'], [80, '40000'], [90, '50000'], [100, '60000']],
  //           tickColor: gridLineColor,
  //           min: 0,
  //           max: 80,
  //           font: {
  //             size: 11,
  //             weight: '600',
  //             color: colors.muted
  //           }
  //         },
  //         xaxis: {
  //           show: true,
  //           color: 'rgba(0,0,0,0.1)',
  //           ticks: data.map((entry, index) => [index, entry.month]),
  //           tickColor: gridLineColor,      
  //           font: {
  //             size: 13,
  //             color: colors.muted
  //           },
  //           reserveSpace: false
  //         }
  //       });
  //     })
  //     .catch(error => {
  //       console.error('Error fetching data:', error);
  //     });
  // }
  // End ***************************************************

  const barData = () => {
    fetch('https://m-kel-tech-tracker.onrender.com/management-summary-sms')
      .then(response => response.json())
      .then(data => {
        // Process the data received from the API
        console.log('Your data', data);
  
        // Process the data to get the labels and values for the chart
        let labels = [];
        let values = [];
  
        data.forEach(p => {
          labels.push(p.carrier);
          values.push(p.sms);
        });
  
        console.log('LABELS2: ', labels);
        console.log('VALUES2: ', values);
  
        // Create the chart using the retrieved data
        if($('#chartjsBar').length) {
          new Chart($("#chartjsBar"), {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [
                {
                  label: "SMS",
                  backgroundColor: ["#A20021", "#81667A", "#F52F57", "#D1F0B1", "#F79D5C", "F3752B", "#92B4A7", "#D1D646"],
                  data: values
                }
              ]
            },
            options: {
              legend: { display: false },
            }
          });
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };
  
  barData()
  
});