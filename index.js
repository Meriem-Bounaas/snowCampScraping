import puppeteer from "puppeteer";



const getEvents = async () => {

// launch puppeteer
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });




// Open a new page
  const page = await browser.newPage();

// go to page
  await page.goto("https://snowcamp2024.sched.com/list/descriptions/", {
    waitUntil: "domcontentloaded",
  });

// Get date 
  const date_events = await page.evaluate(() => {
    
    const date_element = document.querySelectorAll('.sched-current-date')

    const dates = []
    for (let index = 0; index < date_element.length; index++) {
        const date = date_element[index];

        dates.push(date.innerText)
    }

    return dates
  });


// get container

  const containers = await page.evaluate(() => {
    
    const container_elements = document.querySelectorAll('.sched-container-inner')

    const info_containers = []
    for (let index = 0; index < container_elements.length; index++) {
        const container = container_elements[index];

        const title = container.querySelector('.event').querySelector('a').innerText

        const date_lieu = container.querySelector('.sched-event-details-timeandplace').innerText
        const premiereLigne = date_lieu.split('\n')[0]; 
        const date = premiereLigne.split(', ')[0]; 

        const heure = premiereLigne.slice(24, 37)

        const deuxiemeLigne = date_lieu.split('\n')[1]
        const indexWTC = deuxiemeLigne.indexOf('WTC');
        const lieu = deuxiemeLigne.substring(indexWTC)

        const salle = container.querySelector('.sched-event-details-timeandplace').querySelector('a').innerText

        const type_elements = container.querySelector('.sched-event-type').querySelectorAll('div > a')
        const type_result = []
        for (let index = 0; index < type_elements.length; index++) {
            const type_element = type_elements[index];

            type_result.push(type_element.innerText)
        }
        const type = type_result.join(" , ").trim()

        const customFieldsElements = container.querySelector('.tip-custom-fields') ? container.querySelector('.tip-custom-fields').querySelector('li')  : null
        const tags =  customFieldsElements ? customFieldsElements.textContent.split(' ')[2] : '';

        const resumer = container.querySelector('.tip-description') ? document.querySelector('.tip-description').innerHTML : ''

        const speakersList = container.querySelectorAll('.sched-person-session');
            const speakersNames = []
            
            for (let i = 0; i < speakersList.length; i++) {
                const element = speakersList[i];
                speakersNames.push(element.querySelector('h2 > a').innerText)
            }

        const speakers = speakersNames.join(' , ')

        info_containers.push({title, date, heure, salle, lieu, type, speakers, resumer, tags})
    }

    return info_containers
  });



//   console.log(date_events);
  console.log(containers);

  await browser.close();
};



getEvents();