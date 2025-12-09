const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:justify-between md:items-center">
          
          <div className="mb-4 md:mb-0">
            <p className="text-lg font-bold">RETAIL.SYS</p>
            <p className="text-sm text-gray-400">Microservice Retail Demonstration</p>
          </div>

          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition duration-150">About</a>
            <a href="#" className="text-gray-400 hover:text-white transition duration-150">Terms</a>
            <a href="#" className="text-gray-400 hover:text-white transition duration-150">Privacy</a>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} All rights reserved. Built for Scalability Demo.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;