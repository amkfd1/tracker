const Performance = require('../Models/performance');



const getVoipPerformances = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to the beginning of the day

        const allPerformances = await Performance.find({
            date: { $gte: today }
        }).populate({
            path: 'tracker',
            match: { 'service_interest.service_name': 'VoIP' },
            limit: 1
        });

        let minutesGraph = [];

        for (const performance of allPerformances) {
            if (performance.tracker) {
                const voipPerformance = {
                    carrier: performance.tracker.Customer_Name,
                    minutes: performance.minutesRoutesTerminated
                };
                minutesGraph.push(voipPerformance);
            }
        }

        console.log("Today's VoIP performances: ", minutesGraph);
        res.status(200).json(minutesGraph);
    } catch (error) {
        console.error('Error retrieving VoIP performances:', error);
        res.status(500).json({ error: 'Server error' });
    }
};




  const getTotalCarrierVoip = async (req, res) => {
    let carrierId = '64d6219d55063debbf94286a'; // Example carrierId
    try {
        const allPerformances = await Performance.find({ tracker: carrierId }).populate({
            path: 'tracker'
        });

        let minutesGraph = [];
        let mins = [];
        let carrierName = '';

        for (const performance of allPerformances) {
            if (performance.tracker) {
                carrierName = performance.tracker.Customer_Name;
                minutesGraph.push([performance.minutesRoutesTerminated]);
                // .push(mins)
            }
        }

        console.log("Carrier Name: ", carrierName);
        console.log("Minutes Terminated: ", minutesGraph);

        return res.status(200).json({ carrierName, minutesGraph });
    } catch (error) {
        console.error('Error retrieving carrier performances:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};



    



  const getSMSPerformances = async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set time to the beginning of the day

      const allPerformances = await Performance.find({date: { $gte: today }}).populate({
        path: 'tracker',
        match: { 'service_interest.service_name': 'SMS' },
        limit: 1 // Filter for SMS trackers
      });
  
      let minutesGraph = [];
      let mins =[]
      for (const performance of allPerformances) {
        if (performance.tracker && performance.tracker.service_interest.service_name === 'SMS') {
          const smsPerformance = {
            carrier: performance.tracker.Customer_Name,
            sms: performance.totalSMS
          };
          mins.push(smsPerformance);
        }
      }
      let ind = mins.length-1
      minutesGraph.push(mins[ind])
      console.log("ALL SMS: ", minutesGraph)
  
      // console.log('SMS performances: ', minutesGraph);
      res.status(200).json(minutesGraph);
    } catch (error) {
      console.error('Error retrieving SMS performances:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };

const getMonthlyPerformances = async (req, res) => {
  try {
    const allPerformances = await Performance.find();
    let index = 0
    // Group performances by month
    const performancesByMonth = {};
    let flotChart1Data = []
    allPerformances.forEach(performance => {
      const year = performance.date.getFullYear();
      const month = performance.date.getMonth();
      const key = `${year}-${month}`;
      
      
      if (!performancesByMonth[key]) {
        performancesByMonth[key] = {
          year,
          month,
          performances: [],
          totalASR: 0,
          totalACD: 0,
          totalMinutes: 0,
        };
      }
      
      
      performancesByMonth[key].performances.push(performance);
      performancesByMonth[key].totalASR += performance.asr;
      performancesByMonth[key].totalACD += performance.acd;
      performancesByMonth[key].totalMinutes += performance.minutesRoutesTerminated;
    });
    // Get the name of the month
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ];

    // Format the grouped data for response
    const formattedData = Object.values(performancesByMonth).map(monthData => ({
      month: monthNames[monthData.month],
      year: monthData.year,
      totalASR: monthData.totalASR,
      totalACD: monthData.totalACD,
      totalMinutes: monthData.totalMinutes,
    }));
    console.log("The data format: ", flotChart1Data)
    for (i in formattedData){
      let flot = [index, formattedData[i].totalMinutes]
      flotChart1Data.push(flot);
      index += 1
    }
    
    console.log("The data format: ", flotChart1Data)

    res.status(200).json({formattedData, flotChart1Data});
  } catch (error) {
    console.error('Error retrieving performances:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// const addPerformance = async (req, res) => {
//     try {
//       const { trackerId, asr, acd, minutesRoutesTerminated, smsSent } = req.body;

//       // Extract the data from the request body
//         if (!req.body.sms){
//             console.log("you're Adding these stats: ", req.body)
//       // Create a new performance record using the 'Performance' model
//       const newPerformance = new Performance({
//         tracker: trackerId,
//         asr,
//         acd,
//         minutesRoutesTerminated,
//       });
  
//       // Save the performance record to the database
//       const savedPerformance = await newPerformance.save();
//       // Respond with the saved performance data
//             console.log("voip Saved: ", savedPerformance)
//             res.status(201).redirect('/client/'+trackerId);


//         } else if (req.body.sms){
//             const newPerformance = new Performance({
//                 tracker: trackerId,
//                 totalSMS: smsSent
//               });
//             const savedPerformance = await newPerformance.save();
//             console.log("SMS Saved: ", savedPerformance)
//             res.status(201).redirect('/client/'+trackerId);

//         }
      
      
//     } catch (error) {
//       console.error('Error creating performance:', error);
//       res.status(500).json({ error: 'Error creating performance' });
//     }
//   };

const addPerformanceAdmin = async (req, res) => {
  const { trackerId, asr, acd, minutesRoutesTerminated, smsSent, date } = req.body;

  try {

      // Get the current date in 'YYYY-MM-DD' format
      const currentDate = new Date().toISOString().slice(0, 10);

      // Check if a performance record with the same trackerId and current date already exists
      let existingPerformance = await Performance.findOne({
          tracker: trackerId,
          date: { $gte: new Date(date), $lt: new Date(date).setDate(new Date(date).getDate() + 1) },
      });

      // print("Existing: ")
      if (!existingPerformance) {
          // Create a new performance record using the 'Performance' model
          existingPerformance = new Performance({
              tracker: trackerId,
              date,
          });
      }

      // Update the performance record based on the request body
      if (!req.body.sms) {
          existingPerformance.asr = asr;
          existingPerformance.acd = acd;
          existingPerformance.minutesRoutesTerminated = minutesRoutesTerminated;
      } else if (req.body.sms) {
          existingPerformance.totalSMS = smsSent;
      }

      // Save the performance record to the database
      const savedPerformance = await existingPerformance.save();
      console.log("Performance Saved/Updated: ", req.user);
      
        req.flash('update_success', "Stats successfully added")
        res.status(201).redirect('/track/tracker/' + trackerId);

      
  } catch (error) {
      console.error('Error creating/updating performance:', error);
      // res.status(500).json({ error: 'Error creating/updating performance' });
      req.flash('server_error', "Error creating/updating performance")
      res.status(201).redirect('/track/tracker/' + trackerId);

  }
};


const addPerformanceStaff = async (req, res) => {
  const { trackerId, asr, acd, minutesRoutesTerminated, smsSent, date } = req.body;

  try {

      // Get the current date in 'YYYY-MM-DD' format
      // const currentDate = new Date().toISOString().slice(0, 10);

      // Check if a performance record with the same trackerId and current date already exists
      let existingPerformance = await Performance.findOne({
          tracker: trackerId,
          date: date //{ $gte: new Date(date), $lt: new Date(date).setDate(new Date(date).getDate() + 1) },
      });

      // print("Existing: ")
      if (!existingPerformance) {
          // Create a new performance record using the 'Performance' model
          existingPerformance = new Performance({
              tracker: trackerId,
              date: date,
          });
      }

      // Update the performance record based on the request body
      if (!req.body.sms) {
          existingPerformance.asr = asr;
          existingPerformance.acd = acd;
          existingPerformance.minutesRoutesTerminated = minutesRoutesTerminated;
      } else if (req.body.sms) {
          existingPerformance.totalSMS = smsSent;
      }

      // Save the performance record to the database
      const savedPerformance = await existingPerformance.save();
      console.log("Performance Saved/Updated: ", req.user);
      
        req.flash('update_success', "Stats successfully added")
        res.status(201).redirect('/track/tracker/' + trackerId);

      
  } catch (error) {
      console.error('Error creating/updating performance:', error);
      // res.status(500).json({ error: 'Error creating/updating performance' });
      req.flash('server_error', "Error creating/updating performance")
      res.status(201).redirect('/track/tracker/' + trackerId);

  }
};

  module.exports = 
{ 
  getVoipPerformances,
  getMonthlyPerformances,
  addPerformanceAdmin,
  addPerformanceStaff,
  getSMSPerformances,
  getTotalCarrierVoip
}