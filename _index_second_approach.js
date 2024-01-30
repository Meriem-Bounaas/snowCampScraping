import puppeteer from "puppeteer";
import writeYamlFile from 'write-yaml-file'


const getEvents = async () => {

    //launch puppeteer server
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
      });

    // create a new page
    const page = await browser.newPage();

    // Navigate to the URL 
    await page.goto("https://snowcamp2024.sched.com/", {
        waitUntil: "domcontentloaded",
    });

    // function to extract all links
    const eventsLinks =   await page.evaluate(() => { 
        const isValidUrl = (url) => {
            try {
              new URL(url);
              return true;
            } catch (error) {
              return false;
            }
          }

        const allevents = document.querySelectorAll(".event");
        const tableResult = []
        for (let index = 0; index < allevents.length; index++) {
            
            const element = allevents[index];
            
            const link = element.querySelector('a').getAttribute('href')
           
            tableResult.push(isValidUrl(link)? link : `https://snowcamp2024.sched.com/${link}`,)
        }
        return tableResult
    })
 

    // go to link page and extract all informations  
    const events = {}
    for (let index = 0; index < eventsLinks.length; index++) {    
        const link = eventsLinks[index];
        const link_page = await browser.newPage();

        await link_page.goto(link, {
            waitUntil: "domcontentloaded",
        });

        // function to extract detail of event 
        const event_detail =  await  link_page.evaluate(() => {
            const title = document.querySelector('.event a').innerText;
           
            const dateBrute = document.querySelector('.sched-container-dates').innerText
            const date = dateBrute.split('•')[0].trim()
            
            const time = dateBrute.split('•')[1].split('-')[0].trim()
            // const time = dateBrute.split('•')[1].trim()

            const description = document.querySelector('.tip-description') ? document.querySelector('.tip-description').innerText : ''
            
            const adressElement = document.querySelector('.sched-event-details-timeandplace')
            const sale = adressElement ?  adressElement.querySelector('a') ? adressElement.querySelector('a').innerText : '' : ''
            const lieu = adressElement ?  adressElement.querySelector('em') ? adressElement.querySelector('em').innerText : '' : ''
              
            const speakersList = document.querySelectorAll('.sched-person-session');
            const speakersNames = []
            for (let i = 0; i < speakersList.length; i++) {
                const element = speakersList[i];
                speakersNames.push(element.querySelector('h2 > a').innerText)
            }
          
            const type = document.querySelector('.sched-event-type') ? Array.from(document.querySelector('.sched-event-type').querySelectorAll('div > a')).map(x=>x.innerText.trim()).join(", ") : ""
            
            const tagFieldsElements = document.querySelector('.tip-custom-fields') ? document.querySelector('.tip-custom-fields') : null
            const tags = tagFieldsElements ?  tagFieldsElements.querySelector('a') ? tagFieldsElements.querySelector('a').innerText : '' : ''

            const AttendeesList = document.querySelectorAll('#sched-page-event-attendees li')

            return {
                title,
                date,
                time,
                description,
                sale,
                lieu,
                type,
                tags,
                AttendeesList: AttendeesList.length || 0,
                speakersNames: speakersNames.join(" , ")
            }
        })


        // push event_detail object in events object
        events[event_detail.date] = events[event_detail.date]  || {};
        events[event_detail.date][event_detail.sale] = events[event_detail.date][event_detail.sale] || {};
         
        events[event_detail.date][event_detail.sale][event_detail.time] = {
            title:event_detail.title,
            lieu: event_detail.lieu,
            type:event_detail.type,
            tags:event_detail.tags,
        }
        if (event_detail.description)
            events[event_detail.date][event_detail.sale][event_detail.time]['resumer'] = event_detail.description;
        if (event_detail.speakersNames)
            events[event_detail.date][event_detail.sale][event_detail.time]['speakers'] = event_detail.speakersNames;
        
        await link_page.close();
    }

    console.log(events)

    // convert JSON to YAML file
    writeYamlFile('snowCamp.yaml',  events).then(() => {
      console.log('done')
    })
    
   await browser.close();
}

getEvents()