import { useState, useEffect } from "react";
import Marquee from "react-fast-marquee";
import { getTranslation } from "../dictionary";

const DonationDisplay = (props) => {
  const [donationsList, setDonationsList] = useState([]);
  const FONTSIZE = props.fontSize + "px";
  const FONTFAMILYNAME = "DotMatrix";

  const fetchDonations = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/donations.json?t=${timestamp}`);
      const data = await response.json();
      return data.donations;
    } catch (error) {
      console.error("Error fetching donations:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadDonations = async () => {
      const donations = await fetchDonations();
      setDonationsList(donations);
    };

    loadDonations();
  }, []);

  const getDonationText = () => {
    let donationText = getTranslation(props.language, "donationText");
    donationsList.forEach((donation, index) => {
      if (index === donationsList.length - 1) {
        donationText += donation;
      } else {
        donationText += `${donation} *** `;
      }
    });
    return donationText + " ***";
  };

  return (
    <div style={{ padding: "16px" }}>
      <Marquee
        style={{
          color: "orange",
          fontSize: FONTSIZE,
          fontFamily: FONTFAMILYNAME,
        }}
      >
        {getDonationText()}
      </Marquee>
    </div>
  );
};

export default DonationDisplay;
