import { siteContact } from "@/content/site-content";

export default function ContactPage() {
  return (
    <section className="contact_section section_space_lg">
      <div className="container">
        <div className="row align-items-center justify-content-lg-between">
          <div className="col-lg-5">
            <div className="section_heading mb-lg-5">
              <h2 className="section_heading_text">Contact</h2>
              <p className="section_heading_description mb-0">
                Fa primul pas, hai sa luam legatura
              </p>
            </div>
            <div className="row">
              <div className="col-md-6 col-sm-6">
                <ul className="contact_info_list unordered_list_block">
                  <li>
                    <div className="item_icon">
                      <i className="fa-solid fa-phone" />
                    </div>
                    <div className="item_content">
                      <h3 className="item_title">Telefon</h3>
                      <p className="item_info mb-0">{siteContact.phone}</p>
                    </div>
                  </li>
                  <li>
                    <div className="item_icon">
                      <i className="fa-brands fa-whatsapp" />
                    </div>
                    <div className="item_content">
                      <h3 className="item_title">Whatsapp</h3>
                      <p className="item_info mb-0">{siteContact.whatsapp}</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="col-md-6 col-sm-6">
                <ul className="contact_info_list unordered_list_block">
                  <li>
                    <div className="item_icon">
                      <i className="fa-solid fa-envelope" />
                    </div>
                    <div className="item_content">
                      <h3 className="item_title">Email</h3>
                      <p className="item_info mb-0" style={{ fontSize: 16 }}>
                        {siteContact.email}
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="item_icon">
                      <i className="fa-solid fa-location-dot" />
                    </div>
                    <div className="item_content">
                      <h3 className="item_title">Locatie</h3>
                      <p className="item_info mb-0" style={{ fontSize: 15 }}>
                        {siteContact.address}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="office_hour_list bg_primary_light mt-5">
              <h3 className="area_title">Program</h3>
              <ul className="unordered_list_block">
                {siteContact.hours.map((hour) => (
                  <li key={hour.label}>
                    <span>{hour.label}</span>
                    <span>{hour.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="gmap_canvas">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2848.2908915622434!2d26.0929109!3d44.44770609999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b2026f4962b79f%3A0x8b67ba72d0654964!2sMIKO%20MED!5e0!3m2!1sro!2sro!4v1760469436994!5m2!1sro!2sro" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
