import puppeteer from "puppeteer";
import writeYamlFile from 'write-yaml-file'


const getEvents = async () => {

// launch puppeteer
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

// Open a new page
  const page = await browser.newPage();

// go to URL 
  await page.goto("https://snowcamp2024.sched.com/list/descriptions/", {
    waitUntil: "domcontentloaded",
  });

const containers = await page.evaluate(() => {
  
  const container_elements = document.querySelectorAll('.sched-container-inner')
  
  const info_containers = {}
    for (let index = 0; index < container_elements.length; index++) {
        const container = container_elements[index];

        const title = container.querySelector('.event').querySelector('a').innerText

        const date_lieu = container.querySelector('.sched-event-details-timeandplace').innerText
        const premiereLigne = date_lieu.split('\n')[0]; 
        const date = premiereLigne.split(', ')[0]; 

        const heurre = premiereLigne.split('2024 ')[1]
        const heure = heurre.split(' ')[0]

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

        const resumer = container.querySelector('.tip-description') ? container.querySelector('.tip-description').innerText : ''

        const speakersList = container.querySelectorAll('.sched-person-session');
            const speakersNames = []
            
            for (let i = 0; i < speakersList.length; i++) {
                const element = speakersList[i];
                speakersNames.push(element.querySelector('h2 > a').innerText)
            }

        const speakers = speakersNames.join(' , ')

        // push information of container into info_containers object 
        info_containers[date] = info_containers[date] || {} // if info_containers[date] is falsy value , {} will be assigned 
        info_containers[date][salle] = info_containers[date][salle] || {}
        info_containers[date][salle][heure] = {
          title,
          type,
          lieu,
          tags,
        }
        if (resumer)
          info_containers[date][salle][heure]['resumer'] = resumer
          console.log(resumer)
        if (speakers)
          info_containers[date][salle][heure]['speakers'] = speakers
    }
      
    return info_containers
  });
  
  await page.close();

  // convert JSON to YAML file
  writeYamlFile('snowCamp.yaml', containers).then(() => {
    console.log('done')
  })

  await browser.close();
};

getEvents();