import Marquee from "react-fast-marquee";
import { donations } from "../Donations/donations";

const DonationDisplay = (props) => {
  const FONTSIZE = props.fontSize + "px";
  const FONTFAMILYNAME = "DotMatrix";

  const getDonationText = () => {
    let donationText = "Thank you so much for donating to this project: ";
    donations.forEach((donation, index) => {
      if (index === donations.length - 1) {
        donationText += donation;
      } else {
        donationText += `${donation} *** `;
      }
    });
    return donationText;
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
