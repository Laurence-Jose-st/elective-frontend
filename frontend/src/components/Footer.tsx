import 'bootstrap/dist/css/bootstrap.min.css'
import '../App.css'

function Footer() {
  return (
    <footer className="bg-charcoal text-white py-4 mt-5">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-3">
            <h4 className="finlandica-text-regular text-neon-yellow mb-2">Lift It</h4>
            <p className="text-secondary small mb-0">
              Your comprehensive fitness and nutrition tracking platform.
            </p>
          </div>

          <div className="col-md-4 mb-3">
            <h5 className="finlandica-text-regular text-neon-yellow mb-2">Vision</h5>
            <p className="text-secondary small mb-0">
              Empowering individuals to take control of their health through accessible tools.
            </p>
          </div>

          <div className="col-md-4 mb-3">
            <h5 className="finlandica-text-regular text-neon-yellow mb-2">Goal</h5>
            <p className="text-secondary small mb-0">
              Unified platform for workout tracking, nutrition monitoring, and health insights.
            </p>
          </div>
        </div>

        <hr className="border-secondary my-3" />

        <div className="row">
          <div className="col-md-6">
            <p className="text-secondary mb-0 small">
              © 2026 Lift It. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="text-secondary mb-0 small">
              Built with for fitness enthusiasts
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
